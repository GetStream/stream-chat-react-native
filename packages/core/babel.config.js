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
            locales: ['en', 'fr', 'hi', 'it', 'nl', 'ru', 'tr'],
            nsSeparator: null,
            outputPath: 'src/i18n/{{locale}}.json',
          },
        ],
        'module-resolver',
        'react-native-reanimated/plugin',
      ],
      presets: ['@babel/env', 'module:metro-react-native-babel-preset', '@babel/preset-typescript'],
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
          locales: ['nl', 'en', 'it', 'tr', 'fr', 'hi', 'ru'],
          nsSeparator: null,
          outputPath: 'src/i18n/{{locale}}.json',
        },
      ],
      'module-resolver',
    ],
    presets: ['@babel/env', 'module:metro-react-native-babel-preset', '@babel/preset-typescript'],
  };
};
