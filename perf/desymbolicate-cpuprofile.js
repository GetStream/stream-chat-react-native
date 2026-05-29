#!/usr/bin/env node
/**
 * Rewrite a Hermes/V8 .cpuprofile so its frames point at original source
 * locations instead of minified bundle offsets. Uses a single Metro source map.
 *
 * Usage:
 *   node perf/desymbolicate-cpuprofile.js <profile.cpuprofile> <bundle.map> [-o <out>]
 *
 * Input profile may be either:
 *   - V8 .cpuprofile JSON ({ nodes, samples, timeDeltas, ... })
 *   - Chrome trace event array (RN 0.81 Bridgeless / Fusebox Tracing format)
 *
 * Output is always V8 .cpuprofile JSON, which analyze-cpuprofile.js consumes.
 *
 * Per frame we look up (line + 1, column) in the source map and rewrite:
 *   callFrame.url          -> original source path (e.g. package/src/foo.tsx)
 *   callFrame.lineNumber   -> original line - 1  (cpuprofile is 0-indexed)
 *   callFrame.columnNumber -> original column
 *   callFrame.functionName -> source map `name` if present, else keep existing
 *
 * Pseudo-frames ((root), (idle), (gc), GC, builtins with no URL) are passed
 * through untouched.
 */

const fs = require('fs');
const path = require('path');

const { SourceMapConsumer } = require('source-map');

function parseArgs(argv) {
  const out = { positional: [], output: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-o' || a === '--output') out.output = argv[++i];
    else if (a === '-h' || a === '--help') out.help = true;
    else out.positional.push(a);
  }
  return out;
}

function loadJson(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`${label} not found: ${p}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`${label} is not valid JSON: ${p} (${e.message})`);
    process.exit(1);
  }
}

// Normalize input to a V8 .cpuprofile shape so the output is always uniform.
// Mirrors analyze-cpuprofile.js's chromeTraceToV8Profile conversion.
function normalizeToV8(profile) {
  if (!Array.isArray(profile)) return profile;
  const profileEvent = profile.find((e) => e.name === 'Profile');
  const chunkEvents = profile.filter((e) => e.name === 'ProfileChunk');
  const startTime = profileEvent?.args?.data?.startTime || 0;
  const nodesById = new Map();
  const samples = [];
  const timeDeltas = [];
  for (const c of chunkEvents) {
    const d = c.args?.data || {};
    const chunkNodes = d.cpuProfile?.nodes || [];
    const chunkSamples = d.cpuProfile?.samples || [];
    const chunkDeltas = d.timeDeltas || [];
    for (const n of chunkNodes) {
      if (!nodesById.has(n.id)) {
        const cf = { ...(n.callFrame || {}) };
        if (typeof cf.scriptId === 'number') cf.scriptId = String(cf.scriptId);
        nodesById.set(n.id, {
          id: n.id,
          callFrame: cf,
          parent: n.parent || null,
          hitCount: 0,
          children: [],
        });
      }
    }
    for (const s of chunkSamples) samples.push(s);
    for (const dt of chunkDeltas) timeDeltas.push(dt);
  }
  for (const node of nodesById.values()) {
    if (node.parent != null) {
      const p = nodesById.get(node.parent);
      if (p) p.children.push(node.id);
    }
  }
  const totalUs = timeDeltas.reduce((a, b) => a + b, 0);
  return {
    nodes: [...nodesById.values()],
    samples,
    timeDeltas,
    startTime,
    endTime: startTime + totalUs,
  };
}

function isPseudoFrame(cf) {
  const fn = cf.functionName || '';
  if (fn === '(root)' || fn === '(program)' || fn === '(idle)') return true;
  if (fn === '(garbage collector)' || fn === '(gc)') return true;
  return false;
}

function rewriteFrames(profile, consumer) {
  let rewritten = 0;
  let unmapped = 0;
  let skipped = 0;
  for (const node of profile.nodes) {
    const cf = node.callFrame;
    if (!cf) {
      skipped++;
      continue;
    }
    if (isPseudoFrame(cf) || !cf.url) {
      skipped++;
      continue;
    }
    if (typeof cf.lineNumber !== 'number') {
      skipped++;
      continue;
    }
    // cpuprofile lineNumber/columnNumber are 0-indexed;
    // source-map originalPositionFor expects 1-indexed line, 0-indexed column.
    const orig = consumer.originalPositionFor({
      line: cf.lineNumber + 1,
      column: cf.columnNumber || 0,
    });
    if (!orig || orig.source == null) {
      unmapped++;
      continue;
    }
    cf.url = orig.source;
    cf.lineNumber = (orig.line || 1) - 1;
    cf.columnNumber = orig.column || 0;
    if (orig.name) cf.functionName = orig.name;
    rewritten++;
  }
  return { rewritten, unmapped, skipped };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || opts.positional.length !== 2) {
    console.log(`
Usage:
  node perf/desymbolicate-cpuprofile.js <profile.cpuprofile> <bundle.map> [-o <out>]

If -o is omitted, writes <profile>.desymbolicated.cpuprofile next to the input.
`);
    process.exit(opts.help ? 0 : 1);
  }
  const [profilePath, mapPath] = opts.positional;
  const outPath =
    opts.output || profilePath.replace(/\.cpuprofile$/, '') + '.desymbolicated.cpuprofile';

  console.log(`Loading profile: ${path.basename(profilePath)}`);
  const raw = loadJson(profilePath, 'profile');
  const profile = normalizeToV8(raw);
  if (!profile.nodes) {
    console.error('Input does not look like a profile (no nodes after normalization).');
    process.exit(1);
  }
  console.log(`  ${profile.nodes.length} call frames, ${profile.samples?.length || 0} samples`);

  console.log(`Loading source map: ${path.basename(mapPath)}`);
  const rawMap = loadJson(mapPath, 'source map');
  const consumer = new SourceMapConsumer(rawMap);

  console.log('Rewriting frames ...');
  const { rewritten, unmapped, skipped } = rewriteFrames(profile, consumer);
  consumer.destroy && consumer.destroy();

  console.log(`  rewritten: ${rewritten}`);
  console.log(`  unmapped:  ${unmapped}   (source map didn't cover the position)`);
  console.log(`  skipped:   ${skipped}   (pseudo-frames, builtins, missing line)`);

  fs.writeFileSync(outPath, JSON.stringify(profile));
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\nWrote ${sizeKb} KB → ${outPath}`);
  console.log(`\nNext: node perf/analyze-cpuprofile.js ${outPath}`);
}

main();
