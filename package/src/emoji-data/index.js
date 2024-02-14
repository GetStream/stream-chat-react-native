/* eslint-disable no-undef */
const getEmojis = async () => {
  try {
    const response = await fetch(
      'https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji.json',
    );
    const emojis = await response.json();
    const emojiLib = emojis
      .map((emoji) => ({
        id: emoji.short_name,
        name: emoji.short_name,
        names: emoji.short_names,
        ...(emoji.skin_variations
          ? {
              skins: Object.values(emoji.skin_variations).map((skin) =>
                String.fromCodePoint.apply(
                  null,
                  skin.unified.split('-').map((unicode) => `0x${unicode}`),
                ),
              ),
            }
          : {}),
        unicode: String.fromCodePoint.apply(
          null,
          emoji.unified.split('-').map((unicode) => `0x${unicode}`),
        ),
      }))
      .sort((a, b) => (a.name < b.name ? -1 : 1));

    return { emojiLib };
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getEmojis,
};
