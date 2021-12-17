/* eslint-disable no-undef */
const emojiNames = require('./emojiNames.ts');
const emojis = require('./emojis.ts');

const emojiLib = emojis.reduce((acc, cur) => {
  acc[cur.name] = {
    name: cur.name,
    names: cur.names,
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

const emojiArray = emojiNames
  .map(({ name, names }) => ({
    name,
    names: emojiLib[name]?.names ? [...new Set([...emojiLib[name].names, ...names])] : names,
  }))
  .sort((a, b) => (a.name < b.name ? -1 : 1));

module.exports = {
  emojiArray,
  emojiLib,
};
