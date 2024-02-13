/* eslint-disable no-undef */
const fs = require('fs');

const { getEmojis } = require('./index.js');

getEmojis().then(({ emojiArray, emojiLib }) => {
  const stingified = JSON.stringify({
    emojiArray,
    emojiLib,
  }).replace(/(["'])require(?:(?=(\\?))\2.)*?\1/g, (value) => value.replace(/"/g, ''));

  fs.writeFile(
    'compiled.ts',
    `export type EmojiArrayItem = {
      name: string;
      names: string[];
    }

    export type EmojiArray = EmojiArrayItem[];

    export type Emoji = {
      id: string;
      name: string;
      names: string[];
      unicode: string;
      skins?: string[];
    };

    export type EmojiLib = {
      [key: string]: Emoji;
    };

    export type CompiledEmojis = {
      emojiArray: EmojiArray;
      emojiLib: EmojiLib;
    };

    export const compiledEmojis: CompiledEmojis = ${stingified}`,
    (err) => {
      if (err) throw err;
    },
  );
});
