// https://github.com/i18next/i18next-parser#options
/* global module */
module.exports = {
  createOldCatalogs: false,
  input: ['./src/**/*.{tsx,ts}'],
  keepRemoved: true, // Dymanic keys are failed to be parsed so `keepRemoved` is set to `true` - https://github.com/i18next/i18next-parser?tab=readme-ov-file#caveats
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
