// check-native-parity.cjs <repoA> <repoB> — the one-native-project trick (build.sh) is only valid when both
// SampleApps ship the same native modules. Compares the dependency maps of the SampleApp and the native
// wrapper; JS-only packages that may legitimately differ are listed in JS_ONLY. Exits 1 on a native diff.
const path = require('path');
const JS_ONLY = new Set([
  'stream-chat',
  '@stream-io/state-store',
  '@stream-io/i18n',
  'dayjs',
  'i18next',
  'stream-chat-react-native',
  'stream-chat-react-native-core',
]);
const deps = (root, rel) => {
  const p = require(path.join(root, rel, 'package.json'));
  return { ...(p.dependencies || {}) };
};
const [a, b] = process.argv.slice(2).map((p) => path.resolve(p));
let bad = 0;
for (const rel of ['examples/SampleApp', 'package/native-package']) {
  const da = deps(a, rel);
  const db = deps(b, rel);
  for (const k of new Set([...Object.keys(da), ...Object.keys(db)])) {
    if (JS_ONLY.has(k) || da[k] === db[k]) continue;
    console.log(`NATIVE-PARITY ${rel}: ${k} ${da[k]} vs ${db[k]}`);
    bad += 1;
  }
}
if (bad) {
  console.log(
    'Differences above: if any is a native module, build each side with its own native project instead.',
  );
  process.exit(1);
}
console.log('native parity ok');
