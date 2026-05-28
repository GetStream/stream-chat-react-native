#!/usr/bin/env node

/**
 * Analyze a React DevTools Profiler export (the JSON you get from "Save
 * profile" in the Profiler tab — NOT a Hermes .cpuprofile; that's a
 * different format handled by analyze-cpuprofile.js).
 *
 * Usage:
 *   node perf/analyze-react-profile.js path/to/profile.json
 *
 * Output: top components by total self time, by total actual time, by avg
 * self time per render; slowest single commits; what triggered each commit;
 * focused breakdown for Message-row components. All numbers in ms.
 *
 * Implementation notes:
 *  - `snapshots` only contains the fiber tree at the START of the profile.
 *    Fibers that mount DURING the profile (the common case for scroll work)
 *    have their displayName encoded into the per-commit `operations` stream
 *    as length-prefixed UTF-8 entries. We decode that stream so message
 *    rows etc. get real names, not `<unknown-NNN>`.
 *  - Operation codes (React DevTools constants):
 *      1 = TREE_OPERATION_ADD
 *      2 = TREE_OPERATION_REMOVE
 *      3 = TREE_OPERATION_REORDER_CHILDREN
 *      4 = TREE_OPERATION_UPDATE_TREE_BASE_DURATION
 *      5 = TREE_OPERATION_REMOVE_ROOT
 *      6 = TREE_OPERATION_SET_SUBTREE_MODE
 */

const fs = require('fs');
const path = require('path');

const profilePath = process.argv[2];
if (!profilePath) {
  console.error('usage: node perf/analyze-react-profile.js <profile.json>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
const root = data.dataForRoots[0];

// ---- fiberId -> displayName from snapshots (initial tree) ---------------
const fiberInfo = new Map();
for (const [id, info] of root.snapshots) {
  fiberInfo.set(id, info);
}

// ---- Decode operations to learn names of fibers that mount during profile

// op codes
const OP_ADD = 1;
const OP_REMOVE = 2;
const OP_REORDER = 3;
const OP_UPDATE_BASE = 4;
const OP_REMOVE_ROOT = 5;
const OP_SET_SUBTREE_MODE = 6;

function decodeOperations(ops) {
  // ops[0] = rendererID, ops[1] = rootID, ops[2] = stringTableLen
  const stringTableLen = ops[2];
  let i = 3;
  // Build a 1-indexed string table for this commit
  const strings = [null]; // index 0 means "null/no string"
  const tableEnd = i + stringTableLen;
  while (i < tableEnd) {
    const len = ops[i++];
    // bytes follow as UTF-8 code points
    const bytes = ops.slice(i, i + len);
    i += len;
    strings.push(Buffer.from(bytes).toString('utf8'));
  }
  // Now consume operation entries until end of array
  while (i < ops.length) {
    const code = ops[i++];
    switch (code) {
      case OP_ADD: {
        const id = ops[i++];
        const type = ops[i++];
        if (type === 11) {
          // Root: parentID(0), isStrictMode, supportsProfiling, supportsStrictMode, hasOwnerMetadata
          i += 5;
          if (!fiberInfo.has(id)) fiberInfo.set(id, { id, type, displayName: 'Root' });
        } else {
          const parentID = ops[i++];
          const ownerID = ops[i++];
          const displayNameStringID = ops[i++];
          const keyStringID = ops[i++];
          const displayName = strings[displayNameStringID] || null;
          const key = strings[keyStringID] || null;
          if (!fiberInfo.has(id)) {
            fiberInfo.set(id, { id, type, parentID, ownerID, displayName, key });
          } else {
            // Refresh in case snapshots had it with no displayName
            const existing = fiberInfo.get(id);
            if (!existing.displayName && displayName) existing.displayName = displayName;
          }
        }
        break;
      }
      case OP_REMOVE: {
        const n = ops[i++];
        i += n;
        break;
      }
      case OP_REORDER: {
        i++; // id
        const n = ops[i++];
        i += n;
        break;
      }
      case OP_UPDATE_BASE: {
        i += 2;
        break;
      }
      case OP_REMOVE_ROOT: {
        // no args
        break;
      }
      case OP_SET_SUBTREE_MODE: {
        i += 2;
        break;
      }
      default: {
        // unknown — bail out of this commit to avoid corrupting future reads
        return;
      }
    }
  }
}

for (const ops of root.operations) {
  try {
    decodeOperations(ops);
  } catch (e) {
    // tolerate one malformed commit; keep going
  }
}

const nameOf = (id) => {
  const info = fiberInfo.get(id);
  if (!info) return `<unknown-${id}>`;
  return info.displayName || `<anon-type-${info.type}-${id}>`;
};

// ---- Per-name aggregation ------------------------------------------------
const perName = new Map();
function bump(name, fiberId, selfMs, actualMs) {
  let e = perName.get(name);
  if (!e) {
    e = { selfMs: 0, actualMs: 0, renderCount: 0, fiberIds: new Set(), maxSelf: 0, maxActual: 0 };
    perName.set(name, e);
  }
  e.selfMs += selfMs;
  e.actualMs += actualMs;
  e.renderCount += 1;
  e.fiberIds.add(fiberId);
  if (selfMs > e.maxSelf) e.maxSelf = selfMs;
  if (actualMs > e.maxActual) e.maxActual = actualMs;
}

const commits = [];
let totalCommitDuration = 0;
let earliestTs = Infinity;
let latestTs = -Infinity;

for (const commit of root.commitData) {
  const selfMap = new Map(commit.fiberSelfDurations || []);
  const actualMap = new Map(commit.fiberActualDurations || []);
  const ids = new Set([...selfMap.keys(), ...actualMap.keys()]);
  let commitSelf = 0;
  const commitContributors = [];
  for (const id of ids) {
    const name = nameOf(id);
    const selfMs = selfMap.get(id) ?? 0;
    const actualMs = actualMap.get(id) ?? 0;
    bump(name, id, selfMs, actualMs);
    commitSelf += selfMs;
    commitContributors.push({ name, id, selfMs, actualMs });
  }
  commits.push({
    duration: commit.duration,
    effectDuration: commit.effectDuration,
    passiveEffectDuration: commit.passiveEffectDuration,
    priorityLevel: commit.priorityLevel,
    timestamp: commit.timestamp,
    commitSelf,
    contributors: commitContributors,
    updaters: commit.updaters || [],
  });
  totalCommitDuration += commit.duration || 0;
  if (commit.timestamp < earliestTs) earliestTs = commit.timestamp;
  if (commit.timestamp > latestTs) latestTs = commit.timestamp;
}

// ---- Output --------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const padR = (s, n) => String(s).padStart(n);
const fmt = (ms) => `${ms.toFixed(2)}ms`;

console.log(`\n=== Profile summary ===`);
console.log(`File:                    ${path.resolve(profilePath)}`);
console.log(`Root:                    ${root.displayName} (rootID=${root.rootID})`);
console.log(`Commits:                 ${commits.length}`);
console.log(`Wall-time span:          ${(latestTs - earliestTs).toFixed(0)} ms`);
console.log(`Sum of commit durations: ${totalCommitDuration.toFixed(1)} ms`);
console.log(`Avg commit duration:     ${(totalCommitDuration / commits.length).toFixed(2)} ms`);
console.log(
  `Resolved fiber names:    ${[...fiberInfo.values()].filter((f) => f.displayName).length} / ${fiberInfo.size}`,
);

const allEntries = [...perName.entries()].map(([name, e]) => ({ name, ...e }));

console.log(`\n=== Top 40 components by total SELF time ===`);
console.log(
  `${pad('Component', 50)} ${padR('SelfMs', 10)} ${padR('Renders', 8)} ${padR('Avg', 8)} ${padR('Max', 8)}`,
);
allEntries
  .sort((a, b) => b.selfMs - a.selfMs)
  .slice(0, 40)
  .forEach((e) => {
    console.log(
      `${pad(e.name.slice(0, 50), 50)} ${padR(e.selfMs.toFixed(2), 10)} ${padR(e.renderCount, 8)} ${padR((e.selfMs / e.renderCount).toFixed(3), 8)} ${padR(e.maxSelf.toFixed(2), 8)}`,
    );
  });

console.log(`\n=== Top 25 components by total ACTUAL time (incl. children) ===`);
console.log(
  `${pad('Component', 50)} ${padR('ActualMs', 10)} ${padR('Renders', 8)} ${padR('Avg', 8)} ${padR('Max', 8)}`,
);
allEntries
  .sort((a, b) => b.actualMs - a.actualMs)
  .slice(0, 25)
  .forEach((e) => {
    console.log(
      `${pad(e.name.slice(0, 50), 50)} ${padR(e.actualMs.toFixed(2), 10)} ${padR(e.renderCount, 8)} ${padR((e.actualMs / e.renderCount).toFixed(3), 8)} ${padR(e.maxActual.toFixed(2), 8)}`,
    );
  });

console.log(`\n=== Top 25 by AVERAGE self time per render (min 3 renders) ===`);
console.log(`${pad('Component', 50)} ${padR('Avg', 10)} ${padR('Max', 10)} ${padR('Renders', 8)}`);
allEntries
  .filter((e) => e.renderCount >= 3)
  .sort((a, b) => b.selfMs / b.renderCount - a.selfMs / a.renderCount)
  .slice(0, 25)
  .forEach((e) => {
    console.log(
      `${pad(e.name.slice(0, 50), 50)} ${padR((e.selfMs / e.renderCount).toFixed(3), 10)} ${padR(e.maxSelf.toFixed(2), 10)} ${padR(e.renderCount, 8)}`,
    );
  });

console.log(`\n=== Top 25 single-render hits across all commits ===`);
console.log(`${pad('Component', 50)} ${padR('SelfMs', 10)} ${padR('ActualMs', 10)} (commit ts)`);
const allHits = [];
for (const c of commits) {
  for (const x of c.contributors) {
    allHits.push({ ...x, ts: c.timestamp });
  }
}
allHits
  .sort((a, b) => b.selfMs - a.selfMs)
  .slice(0, 25)
  .forEach((h) => {
    console.log(
      `${pad(h.name.slice(0, 50), 50)} ${padR(h.selfMs.toFixed(2), 10)} ${padR(h.actualMs.toFixed(2), 10)} (t=${h.ts.toFixed(0)})`,
    );
  });

console.log(`\n=== Top 12 SLOWEST commits ===`);
commits
  .slice()
  .sort((a, b) => (b.duration || 0) - (a.duration || 0))
  .slice(0, 12)
  .forEach((c, i) => {
    const top = c.contributors
      .slice()
      .sort((a, b) => b.selfMs - a.selfMs)
      .slice(0, 6)
      .map((x) => `${x.name}@${x.selfMs.toFixed(1)}`)
      .join(', ');
    const updaters = (c.updaters || [])
      .map((u) => u.displayName || `<${u.id}>`)
      .slice(0, 4)
      .join(', ');
    console.log(
      `${i + 1}. duration=${fmt(c.duration || 0)} (self=${fmt(c.commitSelf)}, ${c.contributors.length} fibers, prio=${c.priorityLevel}, t=${c.timestamp.toFixed(0)})`,
    );
    console.log(`   updaters: ${updaters || '(none recorded)'}`);
    console.log(`   top self: ${top}`);
  });

console.log(`\n=== Top 20 UPDATERS by # of commits triggered ===`);
const updaterCount = new Map();
for (const c of commits) {
  for (const u of c.updaters || []) {
    const k = u.displayName || `<anon-${u.id}>`;
    updaterCount.set(k, (updaterCount.get(k) || 0) + 1);
  }
}
[...updaterCount.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .forEach(([name, n]) => {
    console.log(`${pad(name.slice(0, 60), 60)} ${padR(n, 6)}`);
  });

// ---- Focused: Message subtree -------------------------------------------
const messageNamesRe =
  /^(Message|MessageWithContext|MemoizedMessage|MessageItemView|MessageItemViewWithContext|MemoizedMessageItemView|MessageContent|MessageContentWithContext|MemoizedMessageContent|MessageFooter|MessageTextContainer|MessageBubble|SwipableMessageWrapper|MessageWrapper|MessageAvatar|MessageAuthor|MessageStatus|MessageTimestamp|MessageReplies|MessageHeader|MessageList|MessageListWithContext|MessageFlashList|MessageFlashListWithContext|MessageSimple|MessageInput|MessageInputWithContext|TypingIndicator|ReactionList)$/;

console.log(`\n=== Message-subtree focus (all matching components, by self time) ===`);
console.log(
  `${pad('Component', 50)} ${padR('SelfMs', 10)} ${padR('ActualMs', 10)} ${padR('Renders', 8)} ${padR('Avg', 8)} ${padR('Max', 8)}`,
);
allEntries
  .filter((e) => messageNamesRe.test(e.name))
  .sort((a, b) => b.selfMs - a.selfMs)
  .forEach((e) => {
    console.log(
      `${pad(e.name.slice(0, 50), 50)} ${padR(e.selfMs.toFixed(2), 10)} ${padR(e.actualMs.toFixed(2), 10)} ${padR(e.renderCount, 8)} ${padR((e.selfMs / e.renderCount).toFixed(3), 8)} ${padR(e.maxSelf.toFixed(2), 8)}`,
    );
  });

// ---- Heuristic buckets --------------------------------------------------
const heuristics = [
  { label: 'Markdown', re: /Markdown|markdown|MDX|renderText|MDRender/i },
  { label: 'Reanimated', re: /Animated|Reanimated|SharedValue/i },
  { label: 'Gesture/RNGH', re: /Gesture|GestureDetector|GestureHandler/i },
  { label: 'FlatList/FlashList', re: /FlatList|FlashList|VirtualizedList|CellRenderer/i },
  { label: 'Image', re: /Image|FastImage|Gallery/i },
  { label: 'Pressable/Touchable', re: /^Pressable$|TouchableOpacity|TouchableHighlight/ },
  { label: 'Context.Provider', re: /Provider$/ },
  { label: 'Memo/ForwardRef wrappers', re: /^Memo|^ForwardRef/ },
  { label: 'Stream Channel*/Chat*/Thread*', re: /^(Channel|Chat|Thread)/ },
  { label: 'Stream Message*', re: /^Message/ },
  { label: 'Reactions', re: /Reaction/ },
  { label: 'Attachments', re: /Attachment|Audio|Video|File|Card/i },
  { label: 'Poll', re: /Poll/ },
  { label: 'Avatar / Author / Status', re: /Avatar|Author|Status/ },
];
console.log(`\n=== Heuristic buckets — total self time across bucket ===`);
console.log(`${pad('Bucket', 42)} ${padR('SelfMs', 8)} ${padR('Renders', 8)} top members`);
for (const h of heuristics) {
  const hits = allEntries.filter((e) => h.re.test(e.name));
  const sumSelf = hits.reduce((s, x) => s + x.selfMs, 0);
  const sumRenders = hits.reduce((s, x) => s + x.renderCount, 0);
  const topNames = hits
    .slice()
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, 6)
    .map((x) => `${x.name}(${x.selfMs.toFixed(0)}ms,${x.renderCount}r)`)
    .join(', ');
  console.log(
    `${pad(h.label, 42)} ${padR(sumSelf.toFixed(1), 8)} ${padR(sumRenders, 8)} ${topNames}`,
  );
}

console.log(`\n=== Components rendered with the most distinct fiber instances ===`);
console.log(
  `${pad('Component', 50)} ${padR('Fibers', 8)} ${padR('Renders', 8)} ${padR('SelfMs', 10)}`,
);
allEntries
  .sort((a, b) => b.fiberIds.size - a.fiberIds.size)
  .slice(0, 25)
  .forEach((e) => {
    console.log(
      `${pad(e.name.slice(0, 50), 50)} ${padR(e.fiberIds.size, 8)} ${padR(e.renderCount, 8)} ${padR(e.selfMs.toFixed(2), 10)}`,
    );
  });

console.log(`\n=== Done ===\n`);
