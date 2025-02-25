const fs = require('fs');

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

getEmojis().then(({ emojiLib }) => {
  const stingified = JSON.stringify(emojiLib).replace(
    /(["'])require(?:(?=(\\?))\2.)*?\1/g,
    (value) => value.replace(/"/g, ''),
  );

  fs.writeFile(
    'src/emoji-data/index.ts',
    `export type Emoji = {
      id: string;
      name: string;
      names: string[];
      unicode: string;
      skins?: string[];
    };

    export type Emojis = Emoji[];

    export const compiledEmojis: Emojis = ${stingified}`,
    (err) => {
      if (err) {
        throw err;
      }
    },
  );
});
