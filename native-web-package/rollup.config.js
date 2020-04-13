// @flow
import babel from 'rollup-plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';

import process from 'process';

import pkg from './package.json';

process.env.NODE_ENV = 'production';

const baseConfig = {
  input: 'src/index.js',
  cache: false,
  watch: {
    chokidar: false,
  },
};

const normalBundle = {
  ...baseConfig,
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [
    'react',
    'react-native',
    'stream-chat-react-native-core',
    '@react-native-community/netinfo',
    '@stream-io/styled-components',
    'react-native-document-picker',
    'react-native-image-picker',
    'modal-react-native-web',
    'es6-symbol',
    '@babel/runtime/regenerator',
    '@babel/runtime/helpers/asyncToGenerator',
    '@babel/runtime/helpers/objectWithoutProperties',
    '@babel/runtime/helpers/toConsumableArray',
    '@babel/runtime/helpers/objectSpread',
    '@babel/runtime/helpers/extends',
    '@babel/runtime/helpers/defineProperty',
    '@babel/runtime/helpers/assertThisInitialized',
    '@babel/runtime/helpers/inherits',
    '@babel/runtime/helpers/getPrototypeOf',
    '@babel/runtime/helpers/possibleConstructorReturn',
    '@babel/runtime/helpers/createClass',
    '@babel/runtime/helpers/classCallCheck',
    '@babel/runtime/helpers/slicedToArray',
    '@babel/runtime/helpers/typeof',
    '@babel/runtime/helpers/taggedTemplateLiteral'
 ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    external(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    commonjs(),
    json(),
  ],
};

export default () =>
  process.env.ROLLUP_WATCH ? [normalBundle] : [normalBundle];
