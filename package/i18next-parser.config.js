// https://github.com/i18next/i18next-parser#options
/* global module */
module.exports = {
  createOldCatalogs: false,
  input: ['./src/**/*.{tsx,ts}'],
  keySeparator: false,
  locales: ['en', 'es', 'fr', 'he', 'hi', 'it', 'ja', 'ko', 'nl', 'pt-br', 'ru', 'tr'],
  namespaceSeparator: false,
  output: 'src/i18n/$LOCALE.json',
  sort(a, b) {
    return a < b ? -1 : 1; // alfabetical order
  },
  useKeysAsDefaultValue: true,
  verbose: true,
};
