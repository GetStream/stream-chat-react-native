/* eslint-disable no-undef */
const getEmojis = async () => {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json',
    );
    const emojis = await response.json();
    const emojiLib = emojis.reduce((acc, cur) => {
      acc[cur.short_name] = {
        id: cur.short_name,
        name: cur.short_name,
        names: cur.short_names,
        ...(cur.skin_variations
          ? {
              skins: Object.values(cur.skin_variations).map((skin) =>
                String.fromCodePoint.apply(
                  null,
                  skin.unified.split('-').map((unicode) => `0x${unicode}`),
                ),
              ),
            }
          : {}),
        unicode: String.fromCodePoint.apply(
          null,
          cur.unified.split('-').map((unicode) => `0x${unicode}`),
        ),
      };
      return acc;
    }, {});

    // This is added because our linter takes the emojis in sorted order.
    const sortedKeys = Object.keys(emojiLib).sort();
    const sortedEmojiLib = {};
    sortedKeys.forEach((key) => {
      sortedEmojiLib[key] = emojiLib[key];
    });

    const emojiArray = emojis
      .map(({ short_name, short_names }) => ({
        name: short_name,
        names: emojiLib[short_name]?.short_names
          ? [...new Set([...emojiLib[short_name].short_names, ...short_names])]
          : short_names,
      }))
      .sort((a, b) => (a.name < b.name ? -1 : 1));

    return { emojiArray, emojiLib: sortedEmojiLib };
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getEmojis,
};
