/* eslint-disable no-undef */
const emojis = require('./emojis.ts');
const emojiShortNames = require('./emojiShortNames.ts');

const emojiLib = emojis.reduce((acc, cur) => {
  acc[cur.short_name] = {
    short_name: cur.short_name,
    short_names: cur.short_names,
    ...(cur.skin_variations
      ? {
          skin_variations: Object.values(cur.skin_variations).map((skin) =>
            String.fromCodePoint.apply(
              null,
              skin.unicode.split('-').map((unicode) => `0x${unicode}`),
            ),
          ),
        }
      : {}),
    sort_order: cur.sort_order,
    unicode: String.fromCodePoint.apply(
      null,
      cur.unicode.split('-').map((unicode) => `0x${unicode}`),
    ),
  };
  return acc;
}, {});

const emojiArray = emojiShortNames
  .map(({ short_name, short_names }) => ({
    short_name,
    short_names: emojiLib[short_name]?.short_names
      ? [...new Set([...emojiLib[short_name].short_names, ...short_names])]
      : short_names,
  }))
  .sort((a, b) => (a.short_name < b.short_name ? -1 : 1));

module.exports = {
  emojiArray,
  emojiLib,
};
