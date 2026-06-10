#!/usr/bin/env node
/**
 * Analyze a Hermes / V8 sampling profile (.cpuprofile) and report what's
 * clogging the JS thread. Also supports diffing two profiles.
 *
 * Usage:
 *   node perf/analyze-cpuprofile.js <profile.cpuprofile>
 *   node perf/analyze-cpuprofile.js --diff <before.cpuprofile> <after.cpuprofile>
 *
 * The .cpuprofile format is the standard Chrome DevTools sampling profile
 * (same JSON shape whether captured from V8 or Hermes). No native deps.
 */

const fs = require('fs');
const path = require('path');

// ---------- helpers ------------------------------------------------------

function microsToMs(us) {
  return (us / 1000).toFixed(1);
}

function pct(num, denom) {
  if (!denom) return '0.00';
  return ((num / denom) * 100).toFixed(2);
}

function pad(s, n, right = false) {
  s = String(s);
  if (s.length >= n) return s;
  return right ? s + ' '.repeat(n - s.length) : ' '.repeat(n - s.length) + s;
}

function nodeLabel(node) {
  const cf = node.callFrame || {};
  const fn = cf.functionName || '(anonymous)';
  const url = cf.url || '';
  if (!url) return fn;
  // Last 2 path segments + line number
  const parts = url.split('/').filter(Boolean);
  const filename = parts.slice(-2).join('/');
  const line = typeof cf.lineNumber === 'number' ? cf.lineNumber + 1 : '?';
  return `${fn}  (${filename}:${line})`;
}

function shortFile(node) {
  const url = (node.callFrame && node.callFrame.url) || '';
  if (!url) return '<native>';
  return url.split('/').slice(-2).join('/');
}

// ---------- profile loader / preprocessor --------------------------------

function loadProfile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    process.exit(1);
  }
  let profile;
  try {
    profile = JSON.parse(raw);
  } catch (err) {
    console.error(`Not valid JSON: ${filePath} (${err.message})`);
    process.exit(1);
  }
  // The file may be one of:
  //   1) A V8 .cpuprofile object: { nodes, samples, timeDeltas, ... }
  //   2) A Chrome trace event array (RN 0.81 Bridgeless `Tracing` domain):
  //      [{name:"Profile", args:{data:{startTime}}}, {name:"ProfileChunk", args:{data:{cpuProfile:{nodes,samples}, timeDeltas}}}, ...]
  // Convert (2) to (1) before returning.
  if (Array.isArray(profile)) {
    profile = chromeTraceToV8Profile(profile, filePath);
  }
  if (!profile.nodes || !profile.samples) {
    console.error(`File does not look like a .cpuprofile (missing nodes/samples): ${filePath}`);
    process.exit(1);
  }
  return profile;
}

// Convert a Chrome trace event array to a V8 .cpuprofile object.
// Hermes/RN Tracing nodes use `parent: <id>`; V8 .cpuprofile uses `children: [<id>...]`.
// We accumulate nodes/samples/timeDeltas across all ProfileChunk events and
// derive `children` from `parent` references.
function chromeTraceToV8Profile(events, filePath) {
  const profileEvent = events.find((e) => e.name === 'Profile');
  const chunkEvents = events.filter((e) => e.name === 'ProfileChunk');
  if (!profileEvent && chunkEvents.length === 0) {
    console.error(`Trace file has no Profile/ProfileChunk events: ${filePath}`);
    process.exit(1);
  }
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
        // Hermes callFrame uses scriptId as number; V8 expects string. Normalize.
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
  // Derive children lists from parent refs
  for (const node of nodesById.values()) {
    if (node.parent != null) {
      const p = nodesById.get(node.parent);
      if (p) p.children.push(node.id);
    }
  }
  // Compute endTime from accumulated deltas
  const totalUs = timeDeltas.reduce((a, b) => a + b, 0);
  return {
    nodes: [...nodesById.values()],
    samples,
    timeDeltas,
    startTime,
    endTime: startTime + totalUs,
  };
}

function buildIndex(profile) {
  const nodesById = new Map();
  for (const node of profile.nodes) {
    nodesById.set(node.id, {
      ...node,
      parent: null,
      selfTimeUs: 0,
      totalTimeUs: 0,
    });
  }
  for (const node of nodesById.values()) {
    if (!node.children) continue;
    for (const childId of node.children) {
      const child = nodesById.get(childId);
      if (child) child.parent = node.id;
    }
  }
  return nodesById;
}

function computeSelfTimes(profile, nodesById) {
  const samples = profile.samples;
  const deltas = profile.timeDeltas || [];
  for (let i = 0; i < samples.length; i++) {
    const nodeId = samples[i];
    const delta = deltas[i] || 0;
    const node = nodesById.get(nodeId);
    if (node) node.selfTimeUs += delta;
  }
}

function computeTotalTimes(nodesById) {
  // Memoized DFS — each tree is independent so no double-counting risk.
  const memo = new Map();
  function totalOf(node) {
    if (memo.has(node.id)) return memo.get(node.id);
    let t = node.selfTimeUs;
    if (node.children) {
      for (const childId of node.children) {
        const child = nodesById.get(childId);
        if (child) t += totalOf(child);
      }
    }
    memo.set(node.id, t);
    return t;
  }
  for (const node of nodesById.values()) {
    node.totalTimeUs = totalOf(node);
  }
}

// ---------- categorization ------------------------------------------------
//
// Generic bucketing: follow the URL, don't hand-curate. The point is to see
// where the JS thread actually goes, not to confirm a hypothesis.
//
// Buckets emitted:
//   Idle                              — (root)/(program)/(idle) pseudo-frames
//   GC                                — garbage collector frames
//   builtin:<Ctor>                    — Hermes/V8 builtins with no URL
//                                      (e.g. builtin:Object covers Object.assign,
//                                      builtin:JSON covers JSON.stringify/parse)
//   VM / native                       — other URL-less frames
//   npm: <pkg>                        — anything resolved under node_modules/<pkg>
//                                      (scoped packages keep their @scope/name)
//   SDK source                        — package/src/** or stream-chat-react-native/(src|lib)
//   App source                        — anything else with a URL (consumer app code)

const NODE_MODULES_PKG_RE = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/;
const SDK_SOURCE_RE = /(?:stream-chat-react-native\/(?:package\/)?(?:src|lib)|\/package\/src)\//;
const BUILTIN_RE = /^([A-Z][A-Za-z0-9]*)\.(?:prototype\.)?[A-Za-z0-9_]+$/;

function categorize(node) {
  const cf = node.callFrame || {};
  const fn = cf.functionName || '';
  const url = cf.url || '';

  if (fn === '(root)' || fn === '(program)' || fn === '(idle)') return 'Idle';
  if (fn === '(garbage collector)' || fn === '(gc)' || /^gc\b/i.test(fn)) return 'GC';

  if (!url) {
    // Hermes/V8 builtins are URL-less; their function names look like
    // `Object.assign`, `JSON.stringify`, `Array.prototype.map`. Bucket by
    // the constructor so the cost of a whole intrinsic family aggregates.
    const m = fn.match(BUILTIN_RE);
    if (m) return `builtin:${m[1]}`;
    return 'VM / native';
  }

  // Check SDK source before npm — if the SDK is profiled from a tarball install,
  // the path will contain both `node_modules/stream-chat-react-native/...` AND
  // match SDK_SOURCE_RE. We want it bucketed as SDK regardless of resolution.
  if (SDK_SOURCE_RE.test(url)) return 'SDK source';

  const pkg = url.match(NODE_MODULES_PKG_RE);
  if (pkg) return `npm: ${pkg[1]}`;

  return 'App source';
}

// ---------- printers ------------------------------------------------------

function printSummary(profile, label = '') {
  const totalDurationUs = profile.endTime - profile.startTime;
  console.log(`\n${label ? '[' + label + '] ' : ''}Profile: ${profile.sourceFile || '(unknown)'}`);
  console.log(
    `  Duration: ${microsToMs(totalDurationUs)} ms   Samples: ${profile.samples.length}   ` +
      `Sample rate: ${(profile.samples.length / (totalDurationUs / 1_000_000)).toFixed(0)}/s`,
  );
  return totalDurationUs;
}

function aggregateBy(nodesById, fn) {
  // Aggregate self time by an arbitrary keyer.
  const agg = new Map();
  for (const node of nodesById.values()) {
    if (!node.selfTimeUs) continue;
    const key = fn(node);
    agg.set(key, (agg.get(key) || 0) + node.selfTimeUs);
  }
  return agg;
}

function topN(agg, n) {
  return Array.from(agg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function printTopBySelf(nodesById, totalDurationUs, limit = 25) {
  const sorted = Array.from(nodesById.values())
    .filter((n) => n.selfTimeUs > 0)
    .sort((a, b) => b.selfTimeUs - a.selfTimeUs)
    .slice(0, limit);

  console.log('\n=== Top functions by SELF time ===');
  console.log(`  ${pad('Self%', 6)}  ${pad('Self ms', 8)}  Function`);
  for (const n of sorted) {
    console.log(
      `  ${pad(pct(n.selfTimeUs, totalDurationUs) + '%', 6)}  ${pad(microsToMs(n.selfTimeUs) + 'ms', 8)}  ${nodeLabel(n)}`,
    );
  }
}

function printTopByTotal(nodesById, totalDurationUs, limit = 25) {
  const sorted = Array.from(nodesById.values())
    .filter((n) => n.totalTimeUs > 0)
    .sort((a, b) => b.totalTimeUs - a.totalTimeUs)
    .slice(0, limit);

  console.log('\n=== Top functions by TOTAL time (incl. callees) ===');
  console.log(`  ${pad('Total%', 6)}  ${pad('Total ms', 8)}  Function`);
  for (const n of sorted) {
    console.log(
      `  ${pad(pct(n.totalTimeUs, totalDurationUs) + '%', 6)}  ${pad(microsToMs(n.totalTimeUs) + 'ms', 8)}  ${nodeLabel(n)}`,
    );
  }
}

function printByCategory(nodesById, totalDurationUs) {
  const byCat = aggregateBy(nodesById, categorize);
  console.log('\n=== Time by category (self time, all frames) ===');
  console.log(`  ${pad('Self%', 6)}  ${pad('Self ms', 8)}  Category`);
  for (const [cat, us] of topN(byCat, 30)) {
    console.log(
      `  ${pad(pct(us, totalDurationUs) + '%', 6)}  ${pad(microsToMs(us) + 'ms', 8)}  ${cat}`,
    );
  }
}

function printByFile(nodesById, totalDurationUs, limit = 25) {
  const byFile = aggregateBy(nodesById, shortFile);
  console.log('\n=== Time by source file (self time) ===');
  console.log(`  ${pad('Self%', 6)}  ${pad('Self ms', 8)}  File`);
  for (const [file, us] of topN(byFile, limit)) {
    console.log(
      `  ${pad(pct(us, totalDurationUs) + '%', 6)}  ${pad(microsToMs(us) + 'ms', 8)}  ${file}`,
    );
  }
}

function findNodesByFunctionName(nodesById, fnName) {
  return Array.from(nodesById.values()).filter(
    (n) => (n.callFrame && n.callFrame.functionName) === fnName,
  );
}

function collectDescendantsBySelf(nodesById, rootNodeId, agg = new Map(), seen = new Set()) {
  if (seen.has(rootNodeId)) return agg;
  seen.add(rootNodeId);
  const node = nodesById.get(rootNodeId);
  if (!node) return agg;
  if (node.selfTimeUs) {
    const key = nodeLabel(node);
    agg.set(key, (agg.get(key) || 0) + node.selfTimeUs);
  }
  if (node.children) {
    for (const childId of node.children) {
      collectDescendantsBySelf(nodesById, childId, agg, seen);
    }
  }
  return agg;
}

function printInside(nodesById, fnName, totalDurationUs) {
  const matches = findNodesByFunctionName(nodesById, fnName);
  if (matches.length === 0) {
    console.log(`\n=== Time inside ${fnName}: NOT FOUND in profile ===`);
    return;
  }
  let totalInside = 0;
  const aggregated = new Map();
  for (const m of matches) {
    totalInside += m.totalTimeUs;
    collectDescendantsBySelf(nodesById, m.id, aggregated);
  }
  console.log(
    `\n=== Time inside ${fnName} (${matches.length} call frame${matches.length === 1 ? '' : 's'}, ${microsToMs(totalInside)}ms total = ${pct(totalInside, totalDurationUs)}% of profile) ===`,
  );
  const sorted = Array.from(aggregated.entries())
    .filter(([_, us]) => us > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
  console.log(`  ${pad('Self%', 7)}  ${pad('Self ms', 8)}  Function`);
  for (const [label, us] of sorted) {
    console.log(
      `  ${pad(pct(us, totalInside) + '%', 7)}  ${pad(microsToMs(us) + 'ms', 8)}  ${label}`,
    );
  }
}

// ---------- single-file mode --------------------------------------------

function detectUnsymbolicated(nodesById) {
  // If nearly every URLed frame shares one bundle URL (e.g. `index.bundle?...`),
  // the profile hasn't been mapped back to source — categorization will collapse
  // into a single "App source" bucket. Warn so the user knows to desymbolicate.
  const urlCounts = new Map();
  let urledFrames = 0;
  for (const node of nodesById.values()) {
    const url = node.callFrame && node.callFrame.url;
    if (!url) continue;
    urledFrames++;
    urlCounts.set(url, (urlCounts.get(url) || 0) + 1);
  }
  if (urledFrames < 50) return false; // too small to judge
  const top = [...urlCounts.values()].sort((a, b) => b - a)[0] || 0;
  return top / urledFrames > 0.9 && urlCounts.size < 5;
}

function analyzeSingle(filePath, options = {}) {
  const profile = loadProfile(filePath);
  profile.sourceFile = path.basename(filePath);
  const totalDurationUs = printSummary(profile);
  const nodesById = buildIndex(profile);
  computeSelfTimes(profile, nodesById);
  computeTotalTimes(nodesById);

  if (detectUnsymbolicated(nodesById)) {
    console.log(
      `\n⚠ This profile looks un-desymbolicated — nearly every frame shares a single bundle URL.`,
    );
    console.log(
      `  Per-package attribution won't work; everything will fall into a single "App source" bucket.`,
    );
    console.log(
      `  Desymbolicate first:  node perf/desymbolicate-cpuprofile.js ${path.basename(filePath)} <bundle.map>`,
    );
  }

  printByCategory(nodesById, totalDurationUs);
  printByFile(nodesById, totalDurationUs);
  printTopBySelf(nodesById, totalDurationUs);
  printTopByTotal(nodesById, totalDurationUs);

  // Optional drilldowns — pass `--inside Foo,Bar` to see what each named function
  // spent its time on (self time of its descendants). No-op if a name isn't in
  // the profile (minified, inlined, or never called).
  for (const name of options.inside || []) {
    printInside(nodesById, name, totalDurationUs);
  }
}

// ---------- diff mode ----------------------------------------------------

function buildAgg(filePath) {
  const profile = loadProfile(filePath);
  const nodesById = buildIndex(profile);
  computeSelfTimes(profile, nodesById);
  computeTotalTimes(nodesById);

  const totalDurationUs = profile.endTime - profile.startTime;
  const byFn = aggregateBy(nodesById, nodeLabel);
  const byCat = aggregateBy(nodesById, categorize);
  const byFile = aggregateBy(nodesById, shortFile);
  return { profile, totalDurationUs, byFn, byCat, byFile };
}

function printCategoryDiff(beforeAgg, afterAgg) {
  const keys = new Set([...beforeAgg.byCat.keys(), ...afterAgg.byCat.keys()]);
  const rows = [];
  for (const k of keys) {
    const b = beforeAgg.byCat.get(k) || 0;
    const a = afterAgg.byCat.get(k) || 0;
    rows.push({
      cat: k,
      before: b,
      after: a,
      delta: a - b,
      beforePct: pct(b, beforeAgg.totalDurationUs),
      afterPct: pct(a, afterAgg.totalDurationUs),
    });
  }
  rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  console.log('\n=== Category diff (self time) — sorted by abs delta ===');
  console.log(
    `  ${pad('Before ms', 10)}  ${pad('After ms', 10)}  ${pad('Delta ms', 10)}  ${pad('Before %', 9)}  ${pad('After %', 9)}  Category`,
  );
  for (const r of rows) {
    const arrow = r.delta < 0 ? '↓' : r.delta > 0 ? '↑' : '·';
    console.log(
      `  ${pad(microsToMs(r.before), 10)}  ${pad(microsToMs(r.after), 10)}  ${pad((r.delta >= 0 ? '+' : '') + microsToMs(r.delta), 10)}  ${pad(r.beforePct + '%', 9)}  ${pad(r.afterPct + '%', 9)}  ${arrow} ${r.cat}`,
    );
  }
}

function printFunctionDiff(beforeAgg, afterAgg, limit = 25) {
  const keys = new Set([...beforeAgg.byFn.keys(), ...afterAgg.byFn.keys()]);
  const rows = [];
  for (const k of keys) {
    const b = beforeAgg.byFn.get(k) || 0;
    const a = afterAgg.byFn.get(k) || 0;
    if (b === 0 && a === 0) continue;
    rows.push({ fn: k, before: b, after: a, delta: a - b });
  }
  rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  console.log(`\n=== Top function deltas (self time, top ${limit} by |delta|) ===`);
  console.log(
    `  ${pad('Before ms', 10)}  ${pad('After ms', 10)}  ${pad('Delta ms', 10)}  Function`,
  );
  for (const r of rows.slice(0, limit)) {
    const arrow = r.delta < 0 ? '↓' : r.delta > 0 ? '↑' : '·';
    console.log(
      `  ${pad(microsToMs(r.before), 10)}  ${pad(microsToMs(r.after), 10)}  ${pad((r.delta >= 0 ? '+' : '') + microsToMs(r.delta), 10)}  ${arrow} ${r.fn}`,
    );
  }
}

function printFunctionDiffFiltered(beforeAgg, afterAgg, pattern) {
  let re;
  try {
    re = new RegExp(pattern, 'i');
  } catch (e) {
    console.error(`Invalid --grep pattern: ${pattern} (${e.message})`);
    return;
  }
  const keys = new Set([...beforeAgg.byFn.keys(), ...afterAgg.byFn.keys()]);
  const rows = [];
  for (const k of keys) {
    if (!re.test(k)) continue;
    const b = beforeAgg.byFn.get(k) || 0;
    const a = afterAgg.byFn.get(k) || 0;
    if (b === 0 && a === 0) continue;
    rows.push({ fn: k, before: b, after: a, delta: a - b });
  }
  rows.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  console.log(`\n=== Function deltas matching /${pattern}/i (self time, all matches) ===`);
  if (rows.length === 0) {
    console.log(`  (no matches)`);
    return;
  }
  console.log(
    `  ${pad('Before ms', 10)}  ${pad('After ms', 10)}  ${pad('Delta ms', 10)}  Function`,
  );
  for (const r of rows) {
    const arrow = r.delta < 0 ? '↓' : r.delta > 0 ? '↑' : '·';
    console.log(
      `  ${pad(microsToMs(r.before), 10)}  ${pad(microsToMs(r.after), 10)}  ${pad((r.delta >= 0 ? '+' : '') + microsToMs(r.delta), 10)}  ${arrow} ${r.fn}`,
    );
  }
}

function analyzeDiff(beforePath, afterPath, options = {}) {
  console.log(
    `Diffing:\n  before: ${path.basename(beforePath)}\n  after:  ${path.basename(afterPath)}`,
  );
  const beforeAgg = buildAgg(beforePath);
  const afterAgg = buildAgg(afterPath);
  console.log(
    `\nDurations — before: ${microsToMs(beforeAgg.totalDurationUs)}ms / after: ${microsToMs(afterAgg.totalDurationUs)}ms`,
  );
  console.log(
    `Samples   — before: ${beforeAgg.profile.samples.length} / after: ${afterAgg.profile.samples.length}`,
  );

  // Sanity check: if sample rates diverge significantly, absolute ms deltas drift.
  // Relative weights remain comparable but warn the reader.
  const beforeRate = beforeAgg.profile.samples.length / (beforeAgg.totalDurationUs / 1_000_000);
  const afterRate = afterAgg.profile.samples.length / (afterAgg.totalDurationUs / 1_000_000);
  const rateSkew = Math.abs(afterRate - beforeRate) / Math.max(beforeRate, afterRate);
  if (rateSkew > 0.1) {
    console.log(
      `\n⚠ Sample rates differ by ${(rateSkew * 100).toFixed(1)}% (${beforeRate.toFixed(0)}/s vs ${afterRate.toFixed(0)}/s).`,
    );
    console.log(`  Absolute ms deltas may be misleading; trust percentages over raw ms.`);
  } else {
    console.log(
      `Note: durations should be similar for a fair comparison. Large differences mean the scenario timing varied; interpret with care.`,
    );
  }

  printCategoryDiff(beforeAgg, afterAgg);
  printFunctionDiff(beforeAgg, afterAgg);
  if (options.grep) printFunctionDiffFiltered(beforeAgg, afterAgg, options.grep);
}

// ---------- main ---------------------------------------------------------

function parseArgs(argv) {
  const out = { positional: [], inside: [], diff: false, grep: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--diff') out.diff = true;
    else if (a === '--inside') out.inside = (argv[++i] || '').split(',').filter(Boolean);
    else if (a === '--grep') out.grep = argv[++i] || null;
    else if (a === '-h' || a === '--help') out.help = true;
    else out.positional.push(a);
  }
  return out;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || opts.positional.length === 0) {
    console.log(`
Usage:
  node perf/analyze-cpuprofile.js <profile.cpuprofile> [--inside Foo,Bar]
  node perf/analyze-cpuprofile.js --diff <before.cpuprofile> <after.cpuprofile> [--grep <pattern>]

Options:
  --inside <names>   Comma-separated function names to drill into (single-file mode).
                     Shows where time inside each named function went.
  --grep <pattern>   In diff mode, also print a filtered function diff matching this regex.
`);
    process.exit(opts.help ? 0 : 1);
  }
  if (opts.diff) {
    if (opts.positional.length !== 2) {
      console.error('--diff requires exactly two .cpuprofile paths');
      process.exit(1);
    }
    analyzeDiff(opts.positional[0], opts.positional[1], { grep: opts.grep });
  } else {
    analyzeSingle(opts.positional[0], { inside: opts.inside });
  }
}

main();
