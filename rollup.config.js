/* eslint-env node */
import babel from 'rollup-plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import images from './rollup-react-native-image.js';
import path from 'path';

import replace from 'rollup-plugin-replace';

import pkg from './package.json';

import process from 'process';
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
    'anchorme',
    'moment',
    'lodash/debounce',
    'lodash/get',
    'lodash/isEqual',
    'lodash/merge',
    'lodash/set',
    'lodash/throttle',
    'lodash/truncate',
    'lodash/uniqBy',
    'lodash/uniqWith',
    'lodash/uniq',
    'lodash-es',
    'deep-equal',
    'seamless-immutable',
    'stream-chat',
    'prop-types',
    'react-native',
    '@stream-io/react-native-simple-markdown',
    'react-native-image-zoom-viewer',
    'react-native-actionsheet',
    'uuid/v4',
    'mime-types',
    'path',
    '@stream-io/styled-components',
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
    '@babel/runtime/helpers/taggedTemplateLiteral',
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
    images({
      sourceDir: path.join(__dirname, 'src'),
    }),
    commonjs(),
    json(),
  ],
};

export default () =>
  process.env.ROLLUP_WATCH ? [normalBundle] : [normalBundle];
