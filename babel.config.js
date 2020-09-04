module.exports = (api) => {
  const isTest = api.env('test');

  if (isTest) {
    return {
      overrides: [
        {
          compact: false,
        },
      ],
      plugins: ['macros', 'module-resolver', 'babel-plugin-styled-components'],
      presets: [
        '@babel/env',
        'module:metro-react-native-babel-preset',
        '@babel/preset-typescript',
      ],
    };
  }

  return {
    comments: true,
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
    plugins: ['macros', 'module-resolver', 'babel-plugin-styled-components'],
    presets: [
      '@babel/env',
      'module:metro-react-native-babel-preset',
      '@babel/preset-typescript',
    ],
  };
};
