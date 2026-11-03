/**
 * The code the e2e impact analysis maps (e2e/README.md): shared by the babel plugin that instruments
 * it and the collector that lists it. Matches `source_paths` in the Fastfile's `select_e2e_tests`.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../..');

const included = ['package/src/', 'package/native-package/src/', 'examples/E2ETestApp/'];
const excluded = [
  /\/node_modules\//,
  /\/__tests__\//,
  /^package\/src\/mock-builders\//,
  /^examples\/E2ETestApp\/(e2e|android|ios|stream-chat-test-mock-server)\//,
  /^examples\/E2ETestApp\/(\.detoxrc|[^/]+\.config)\.js$/,
  /\.test\.(js|jsx|ts|tsx)$/,
  /\.d\.ts$/,
];

const isSource = (id) =>
  /\.(js|jsx|ts|tsx)$/.test(id) &&
  included.some((prefix) => id.startsWith(prefix)) &&
  !excluded.some((re) => re.test(id));

const realpath = (file) => {
  try {
    return fs.realpathSync(file);
  } catch {
    return file;
  }
};

/** The repo-relative path of a file to instrument, or undefined when it isn't mapped. */
const sourceId = (filename) => {
  if (!filename) {
    return undefined;
  }
  const id = path.relative(repoRoot, realpath(filename)).split(path.sep).join('/');
  return isSource(id) ? id : undefined;
};

module.exports = { isSource, repoRoot, sourceId };
