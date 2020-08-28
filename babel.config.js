// eslint-disable-next-line no-undef
module.exports = {
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
  plugins: ['macros', 'babel-plugin-styled-components'],
  presets: ['@babel/env', 'module:metro-react-native-babel-preset'],
};
