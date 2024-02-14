/* eslint-disable no-undef */
const fs = require('fs');

const { getEmojis } = require('./index.js');

getEmojis().then(({ emojiLib }) => {
  const stingified = JSON.stringify(emojiLib).replace(
    /(["'])require(?:(?=(\\?))\2.)*?\1/g,
    (value) => value.replace(/"/g, ''),
  );

  fs.writeFile(
    'compiled.ts',
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
      if (err) throw err;
    },
  );
});
