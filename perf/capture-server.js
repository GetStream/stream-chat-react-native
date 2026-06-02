#!/usr/bin/env node
/**
 * Long-form Hermes profiling capture. Connects to Metro's inspector, streams
 * Tracing.dataCollected events during the entire capture (the listener is
 * installed BEFORE Tracing.start, which is what makes this work — the old
 * capture-hermes-profile.js installs the listener after Tracing.end and so
 * only sees the post-end flush, limiting captures to ~2-3s).
 *
 * Usage:
 *   node perf/capture-server.js [label]
 *   PERF_MAP=path/to/bundle.map node perf/capture-server.js [label]
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const readline = require('readline');

const METRO_HOST = process.env.METRO_HOST || 'localhost';
const METRO_PORT = process.env.METRO_PORT || '8081';
const PROFILES_DIR = path.join(__dirname, 'profiles');
const MAP_PATH = process.env.PERF_MAP ? path.resolve(process.env.PERF_MAP) : null;
const LABEL = (process.argv[2] || 'capture').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);

fs.mkdirSync(PROFILES_DIR, { recursive: true });

if (typeof WebSocket === 'undefined') {
  console.error('Global WebSocket missing — run on Node 22+.');
  process.exit(1);
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function downloadToFile(url, outPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outPath);
    http
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.destroy();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(outPath)));
        file.on('error', reject);
      })
      .on('error', reject);
  });
}

// Find the first Metro bundle URL in a Chrome trace event array (the shape
// capture-server.js writes — Tracing.dataCollected payload). We look at the
// ProfileChunk events' embedded cpuProfile nodes.
function findBundleUrlInTrace(events) {
  for (const ev of events || []) {
    const nodes = ev?.args?.data?.cpuProfile?.nodes;
    if (!nodes) continue;
    for (const n of nodes) {
      const url = n?.callFrame?.url;
      if (typeof url === 'string' && /\.bundle\b/.test(url)) return url;
    }
  }
  return null;
}

// Source map sits at the same path as the bundle, but with .bundle → .map.
// Hermes / Metro inspector emits a malformed URL like
//   http://host/index.bundle//&platform=android&dev=true&...
// where the query string is glued on with `//&` instead of `?`. We can't use
// the WHATWG URL parser (it would treat `//&...` as path, not query). Parse
// regex-style, strip the leading `/*[?&]` separators, and rebuild as
// /index.map?<params>. Also force the host — the captured URL may be
// 10.0.2.2 (Android emulator) or a LAN IP unreachable from this script.
function deriveMapUrl(bundleUrl) {
  const m = bundleUrl.match(/^https?:\/\/[^/]+\/(.+?)\.bundle\/*[?&]?(.*)$/);
  if (!m) return null;
  const basePath = m[1];
  const query = m[2];
  return `http://${METRO_HOST}:${METRO_PORT}/${basePath}.map${query ? '?' + query : ''}`;
}

function pickTarget(targets) {
  const score = (t) => {
    const s = `${t.title || ''} ${t.deviceName || ''} ${t.type || ''}`.toLowerCase();
    let n = 0;
    if (s.includes('hermes')) n += 5;
    if (s.includes('rnruntime') || s.includes('react native')) n += 3;
    if (t.webSocketDebuggerUrl) n += 1;
    return n;
  };
  return targets.filter((t) => t.webSocketDebuggerUrl).sort((a, b) => score(b) - score(a))[0];
}

function prompt(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(msg, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function main() {
  console.log(`Connecting to Metro at ${METRO_HOST}:${METRO_PORT} ...`);
  let targets;
  try {
    targets = await httpGetJson(`http://${METRO_HOST}:${METRO_PORT}/json/list`);
  } catch (e) {
    console.error(`✗ Could not reach Metro. Is \`yarn workspace sampleapp start\` running?`);
    process.exit(1);
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    console.error('✗ Metro reported no debug targets — is the app open?');
    process.exit(1);
  }
  const target = pickTarget(targets);
  if (!target) {
    console.error('✗ No Hermes target with a webSocketDebuggerUrl.');
    process.exit(1);
  }
  console.log(
    `  ↳ ${target.title || '(no title)'} ${target.deviceName ? `(${target.deviceName})` : ''}`,
  );

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let msgId = 0;
  const pending = new Map();
  const tracingEvents = [];

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  // KEY: this listener has to be installed BEFORE Tracing.start, so it catches
  // dataCollected events streaming during the whole capture, not just the
  // post-end flush. That's what makes long captures work.
  ws.addEventListener('message', (evt) => {
    let msg;
    try {
      msg = JSON.parse(evt.data);
    } catch {
      return;
    }
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
      return;
    }
    if (msg.method === 'Tracing.dataCollected') {
      const arr = msg.params?.value || [];
      for (const ev of arr) tracingEvents.push(ev);
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(new Error(`WS error: ${e.message || e}`)));
  });

  // sampling-frequency in microseconds between samples → 10000us = 100Hz.
  // Lower frequency (higher value) = lighter device overhead, longer coverage.
  await send('Tracing.start', {
    categories: '-*,disabled-by-default-v8.cpu_profiler.hires,disabled-by-default-v8.cpu_profiler',
    options: 'sampling-frequency=10000',
    transferMode: 'ReportEvents',
  });

  console.log(`\nTracing started. Run your scenario on device.`);
  await prompt(`Press Enter to STOP and save: `);

  console.log('Stopping ...');
  await send('Tracing.end');
  // Wait briefly for any tail dataCollected events Hermes still has buffered.
  await new Promise((r) => setTimeout(r, 1500));
  try {
    ws.close();
  } catch {
    /* ignore */
  }

  if (tracingEvents.length === 0) {
    console.error('✗ No samples collected — was the app idle the whole time?');
    process.exit(1);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(PROFILES_DIR, `${LABEL}-${ts}.cpuprofile`);
  fs.writeFileSync(outPath, JSON.stringify(tracingEvents));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Saved ${sizeKb} KB → ${path.relative(process.cwd(), outPath)}\n`);

  // Resolve the source map. Priority:
  //   1) PERF_MAP=<path> — explicit override (release builds, offline cases).
  //   2) Auto-fetch from Metro using the bundle URL embedded in the profile.
  //   3) Skip entirely if PERF_SKIP_DESYM=1.
  // Auto-fetched maps go to /tmp and get cleaned up after desym runs.
  let mapPath = MAP_PATH && fs.existsSync(MAP_PATH) ? MAP_PATH : null;
  let autoFetchedMap = null;
  if (!mapPath && !process.env.PERF_SKIP_DESYM) {
    const bundleUrl = findBundleUrlInTrace(tracingEvents);
    const mapUrl = bundleUrl ? deriveMapUrl(bundleUrl) : null;
    if (!mapUrl) {
      console.log('No .bundle URL in profile — skipping auto-desymbolication.');
    } else {
      const tmpMap = path.join(os.tmpdir(), `metro-${Date.now()}.map.json`);
      console.log(`Fetching source map:\n  ${mapUrl}`);
      try {
        await downloadToFile(mapUrl, tmpMap);
        mapPath = tmpMap;
        autoFetchedMap = tmpMap;
      } catch (e) {
        console.error(`Could not fetch source map (${e.message}) — analyzing raw profile.`);
      }
    }
  }

  let analyzeTarget = outPath;
  if (mapPath && fs.existsSync(mapPath)) {
    console.log(`Desymbolicating with ${mapPath} ...`);
    const desym = spawnSync(
      process.execPath,
      [path.join(__dirname, 'desymbolicate-cpuprofile.js'), outPath, mapPath],
      { stdio: 'inherit' },
    );
    if (desym.status === 0) {
      const candidate = outPath.replace(/\.cpuprofile$/, '') + '.desymbolicated.cpuprofile';
      if (fs.existsSync(candidate)) analyzeTarget = candidate;
    } else {
      console.error('Desymbolication failed — analyzing raw profile.');
    }
    if (autoFetchedMap && fs.existsSync(autoFetchedMap)) fs.unlinkSync(autoFetchedMap);
  }

  console.log(`\nAnalyzing ${path.basename(analyzeTarget)} ...\n`);
  const analyzerArgs = [path.join(__dirname, 'analyze-cpuprofile.js'), analyzeTarget];
  if (process.env.PERF_INSIDE) {
    analyzerArgs.push('--inside', process.env.PERF_INSIDE);
  }
  const r = spawnSync(process.execPath, analyzerArgs, { stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
