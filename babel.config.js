module.exports = {
  presets: [
    '@babel/env',
    '@babel/react',
    '@babel/preset-flow',
    'module:metro-react-native-babel-preset',
  ],
  plugins: [
    'macros',
    // ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/transform-runtime',
    'babel-plugin-styled-components',
  ],
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
