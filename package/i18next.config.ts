import { defineConfig } from 'i18next-cli';

export default defineConfig({
  "locales": [
    "en",
    "es",
    "fr",
    "he",
    "hi",
    "it",
    "ja",
    "ko",
    "nl",
    "pt-br",
    "ru",
    "tr"
  ],
  "extract": {
    "input": [
      "./src/**/*.{tsx,ts}"
    ],
    "output": "src/i18n/{{language}}.json",
    "defaultNS": "translation",
    "keySeparator": false,
    "nsSeparator": false,
    "functions": [
      "t",
      "*.t"
    ],
    "transComponents": [
      "Trans"
    ]
  },
  "types": {
    "input": [
      "locales/{{language}}/{{namespace}}.json"
    ],
    "output": "src/types/i18next.d.ts"
  }
});