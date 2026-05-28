#!/usr/bin/env node

/**
 * Capture a Hermes CPU profile from a running React Native app via Metro's
 * inspector WebSocket. Works on iOS and Android with no app code changes
 * and no react-native-fs / native modules.
 *
 * Prereqs:
 *   1. Metro running (e.g. `yarn workspace sampleapp start`).
 *   2. SampleApp open on a device or simulator (Hermes is on by default in
 *      RN 0.70+).
 *
 * Usage:
 *   node perf/capture-hermes-profile.js [output-path]
 *
 * Flow:
 *   1. Asks Metro for its list of debug targets at http://localhost:8081/json/list
 *   2. Connects to the Hermes target's webSocketDebuggerUrl
 *   3. Sends Profiler.enable + Profiler.start (Chrome DevTools Protocol)
 *   4. Waits for you to press Enter
 *   5. Sends Profiler.stop, receives the profile JSON
 *   6. Writes to disk as a `.cpuprofile`
 *
 * Then: `node perf/analyze-cpuprofile.js <output-path>`
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const readline = require('readline');

const OUT =
  process.argv[2] ||
  path.join(
    __dirname,
    'profiles',
    `hermes-${new Date().toISOString().replace(/[:.]/g, '-')}.cpuprofile`,
  );

const METRO_HOST = process.env.METRO_HOST || 'localhost';
const METRO_PORT = process.env.METRO_PORT || '8081';

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

function prompt(msg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(msg, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

function pickTarget(targets) {
  // Prefer something that mentions Hermes / RNRuntime; fall back to first with a JS context.
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

async function main() {
  console.log(`Looking for Metro at http://${METRO_HOST}:${METRO_PORT} ...`);
  let targets;
  try {
    targets = await httpGetJson(`http://${METRO_HOST}:${METRO_PORT}/json/list`);
  } catch (e) {
    console.error(`Could not reach Metro at ${METRO_HOST}:${METRO_PORT}.`);
    console.error('Make sure `yarn workspace sampleapp start` is running and the app is open.');
    process.exit(1);
  }

  if (!Array.isArray(targets) || targets.length === 0) {
    console.error('Metro reported no debug targets. Is the app open on a device/simulator?');
    process.exit(1);
  }

  const target = pickTarget(targets);
  if (!target) {
    console.error('No debug target had a webSocketDebuggerUrl. Targets:');
    console.error(JSON.stringify(targets, null, 2));
    process.exit(1);
  }

  console.log(`Found target: ${target.title || '(no title)'} — ${target.deviceName || ''}`);
  console.log(`Connecting: ${target.webSocketDebuggerUrl}`);

  // Node 22+ has global WebSocket; older Node would need `ws`.
  if (typeof WebSocket === 'undefined') {
    console.error(
      'Global WebSocket is not available — you are on Node < 22. Either upgrade Node or `yarn add -D ws` and let me know.',
    );
    process.exit(1);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 0;
  const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

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
    }
  });

  await new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(new Error(`WS error: ${e.message || e}`)));
  });

  // RN 0.81 Bridgeless / Fusebox dropped the CDP `Profiler` domain. The
  // working alternatives are (a) the Tracing domain, (b) calling
  // HermesInternal.enableSamplingProfiler directly via Runtime.evaluate.
  // We try (a) first — easier to parse — then fall back to (b).

  const tryProfilerCdp = async () => {
    try {
      await send('Profiler.enable');
      await send('Profiler.start');
      return 'profiler';
    } catch {
      return null;
    }
  };

  const tryTracing = async () => {
    try {
      // Chrome trace category that emits CPU samples
      await send('Tracing.start', {
        categories:
          '-*,disabled-by-default-v8.cpu_profiler.hires,disabled-by-default-v8.cpu_profiler',
        options: 'sampling-frequency=10000',
        transferMode: 'ReturnAsStream',
      });
      return 'tracing';
    } catch {
      return null;
    }
  };

  const tryHermesInternal = async () => {
    const res = await send('Runtime.evaluate', {
      expression:
        'typeof HermesInternal === "object" && typeof HermesInternal.enableSamplingProfiler === "function"',
      returnByValue: true,
    });
    if (res?.result?.value !== true) return null;
    await send('Runtime.evaluate', {
      expression: 'HermesInternal.enableSamplingProfiler(true)',
      returnByValue: true,
    });
    return 'hermes';
  };

  console.log('Connected. Probing profiler support ...');
  let mode = await tryProfilerCdp();
  if (!mode) mode = await tryTracing();
  if (!mode) mode = await tryHermesInternal();
  if (!mode) {
    console.error('None of Profiler / Tracing / HermesInternal worked on this target. Aborting.');
    process.exit(1);
  }
  console.log(`Using ${mode} mode.`);

  console.log('\n=== PROFILING. Do your scenario now (open channel, scroll, etc). ===');
  await prompt('Press Enter to STOP and save the profile: ');

  console.log('Stopping profile ...');
  let profileJson;

  if (mode === 'profiler') {
    const result = await send('Profiler.stop');
    profileJson = result?.profile;
  } else if (mode === 'tracing') {
    const collected = [];
    const onMessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Tracing.dataCollected') {
        collected.push(...(msg.params?.value || []));
      }
    };
    ws.addEventListener('message', onMessage);
    await send('Tracing.end');
    // Wait briefly for Tracing.tracingComplete + dataCollected events
    await new Promise((r) => setTimeout(r, 1500));
    profileJson = collected;
  } else if (mode === 'hermes') {
    // For HermesInternal mode we need an absolute path the app can write to.
    // iOS Simulator inherits the host's /tmp — works directly. For an iOS
    // device or Android device this path won't work; user will need to grab
    // the file off-device.
    const devicePath = `/tmp/hermes-${Date.now()}.cpuprofile`;
    await send('Runtime.evaluate', {
      expression: `HermesInternal.dumpSampledTraceToFile(${JSON.stringify(devicePath)})`,
      returnByValue: true,
    });
    await send('Runtime.evaluate', {
      expression: 'HermesInternal.enableSamplingProfiler(false)',
      returnByValue: true,
    });
    console.log(`\nProfile written by the app to: ${devicePath}`);
    console.log('If you are on iOS Simulator, that path is accessible directly on your Mac.');
    console.log(
      'If you are on an iOS device, you will need to pull it via Xcode Devices → app sandbox.',
    );
    ws.close();
    process.exit(0);
  }

  if (!profileJson) {
    console.error('No profile returned. Mode:', mode);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(profileJson));
  const stats = fs.statSync(OUT);
  console.log(`\nSaved ${(stats.size / 1024).toFixed(1)} KB profile to:`);
  console.log(`  ${OUT}`);

  ws.close();

  // Chain into the analyzer so the user doesn't have to copy-paste a path.
  const { spawnSync } = require('child_process');
  const analyzer = path.join(__dirname, 'analyze-cpuprofile.js');
  console.log(`\nRunning analyzer:\n  node ${analyzer} ${OUT}\n`);
  const r = spawnSync(process.execPath, [analyzer, OUT], { stdio: 'inherit' });
  process.exit(r.status ?? 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
