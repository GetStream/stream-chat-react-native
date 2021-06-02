/* eslint-disable no-undef */
const fs = require('fs');

const { emojiArray, emojiLib } = require('./index.js');

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
    name: string;
    names: string[];
    sort_order: number;
    unicode: string;
    skin_variations?: string[];
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
