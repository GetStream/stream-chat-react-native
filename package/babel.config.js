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
    plugins: ['module-resolver'],
    presets: ['@babel/env', 'module:metro-react-native-babel-preset', '@babel/preset-typescript'],
  };
};
