// Wraps the SampleApp's babel transformer (source patches at bundle time; nothing is edited on disk).
// Always: the SampleApp channel list query asks for 100 messages per channel instead of 25, so a channel
// opened from the list renders 100 loaded messages on both sides without a network round trip. The
// bundle fails if the pattern is gone (update MESSAGE_LIMIT_FROM when the SampleApp changes).
// With GAUNTLET_DIAG=1 only (diagnostic builds, never the measured ones): Message's areEqual reports which
// check failed to globalThis.__benchAreEqual.
const upstream = require(process.env.GAUNTLET_UPSTREAM_TRANSFORMER);
const MESSAGE_LIMIT_FROM = 'message_limit: 25,';

const diagAreEqual = (src) => {
  const start = src.indexOf('const areEqual = (');
  const end = src.indexOf('const MemoizedMessage', start);
  if (start < 0 || end < 0) throw new Error('bench: areEqual not found');
  const body = src
    .slice(start, end)
    .replace(
      /if \(!(\w+)\) \{\s*return false;\s*\}/g,
      "if (!$1) { globalThis.__benchAreEqual && globalThis.__benchAreEqual('$1'); return false; }",
    )
    .replace(
      /if \((\w+)\) \{\s*return false;\s*\}/g,
      "if ($1) { globalThis.__benchAreEqual && globalThis.__benchAreEqual('$1'); return false; }",
    )
    .replace(
      /return true;\s*\};\s*$/,
      "globalThis.__benchAreEqual && globalThis.__benchAreEqual('EQUAL'); return true;\n};\n",
    );
  return src.slice(0, start) + body + src.slice(end);
};

module.exports = {
  ...upstream,
  // Diag and measured builds must never share Metro's transform cache.
  getCacheKey: () =>
    [
      upstream.getCacheKey ? upstream.getCacheKey() : '',
      'gauntlet-v1',
      process.env.GAUNTLET_DIAG ? 'diag' : 'measured',
    ].join(':'),
  transform(args) {
    if (args.filename.endsWith('src/screens/ChannelListScreen.tsx')) {
      const src = args.src.replace(MESSAGE_LIMIT_FROM, 'message_limit: 100,');
      if (src === args.src) throw new Error('bench: message_limit patch did not apply');
      return upstream.transform({ ...args, src });
    }
    if (process.env.GAUNTLET_DIAG && /(^|\/)runtime\/probe\.js$/.test(args.filename)) {
      const src = args.src.replace('var DIAG = false;', 'var DIAG = true;');
      if (src === args.src) throw new Error('bench: DIAG flag patch did not apply');
      return upstream.transform({ ...args, src });
    }
    if (
      process.env.GAUNTLET_DIAG &&
      /package\/src\/components\/Message\/Message\.tsx$/.test(args.filename)
    ) {
      return upstream.transform({ ...args, src: diagAreEqual(args.src) });
    }
    return upstream.transform(args);
  },
};
