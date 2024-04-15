/* global module */
module.exports = (api) => {
  const isTest = api.env('test');

  if (isTest) {
    return {
      overrides: [
        {
          compact: false,
        },
      ],
      plugins: [
        [
          'i18next-extract',
          {
            contextSeparator: '__',
            defaultContexts: [''],
            defaultNS: 'en',
            discardOldKeys: true,
            jsonSpace: 4,
            keyAsDefaultValue: ['en'],
            keyAsDefaultValueForDerivedKeys: false,
            keySeparator: null,
            locales: ['en', 'es', 'fr', 'he', 'hi', 'it', 'ja', 'ko', 'nl', 'ru', 'tr', 'pt-BR'],
            nsSeparator: null,
            outputPath: 'src/i18n/{{locale}}.json',
          },
        ],
        'module-resolver',
        'react-native-reanimated/plugin',
      ],
      presets: ['@babel/env', 'module:@react-native/babel-preset', '@babel/preset-typescript'],
    };
  }

  return {
    env: {
      production: {
        presets: [
          [
            '@babel/env',
            {
              modules: false,
            },
          ],
        ],
      },
    },
    overrides: [
      {
        compact: false,
      },
    ],
    plugins: [
      [
        'i18next-extract',
        {
          contextSeparator: '__',
          defaultContexts: [''],
          defaultNS: 'en',
          discardOldKeys: true,
          jsonSpace: 4,
          keyAsDefaultValue: ['en'],
          keyAsDefaultValueForDerivedKeys: false,
          keySeparator: null,
          locales: ['en', 'es', 'fr', 'he', 'hi', 'it', 'ja', 'ko', 'nl', 'ru', 'tr', 'pt-BR'],
          nsSeparator: null,
          outputPath: 'src/i18n/{{locale}}.json',
        },
      ],
      'module-resolver',
    ],
    presets: ['@babel/env', 'module:@react-native/babel-preset', '@babel/preset-typescript'],
  };
};
