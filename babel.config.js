module.exports = {
  presets: ['@babel/env', 'module:metro-react-native-babel-preset'],
  plugins: ['macros', 'babel-plugin-styled-components'],
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
};
