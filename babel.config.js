module.exports = {
  presets: ['@babel/env', '@babel/react', '@babel/preset-flow'],
  plugins: [
    'macros',
    '@babel/proposal-class-properties',
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
