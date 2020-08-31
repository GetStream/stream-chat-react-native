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
  plugins: [
    'macros',
    'babel-plugin-styled-components',
    ['babel-plugin-typescript-to-proptypes', { comments: true }],
  ],
  presets: ['@babel/env', 'module:metro-react-native-babel-preset'],
};
