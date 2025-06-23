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
      plugins: ['module-resolver', 'react-native-reanimated/plugin'],
      presets: ['module:@react-native/babel-preset'],
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
    plugins: ['module-resolver'],
    presets: ['module:@react-native/babel-preset'],
  };
};
