import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactNative from 'eslint-plugin-react-native';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginJest from 'eslint-plugin-jest';

import eslintReactNativeConfig from '@react-native/eslint-config';

import tsEslint from 'typescript-eslint';

const globals = Object.keys(eslintReactNativeConfig.globals).reduce((acc, key) => {
  if (eslintReactNativeConfig.globals[key]) {
    acc[key] = 'readonly';
  }
  return acc;
}, {});

export default tsEslint.config(
  tsEslint.configs.recommended,
  {
    ignores: ['node_modules/', 'dist/', '**/*.config.js'],
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals,
        console: 'readonly',
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-native': eslintPluginReactNative,
      'eslint-comments': eslintPluginComments,
      'react-hooks': eslintPluginReactHooks,
      jest: eslintPluginJest,
    },
    rules: {
      ...eslintReactNativeConfig.rules,
      'jsx-quotes': ['error', 'prefer-single'],
      'react-native/no-inline-styles': 'off',
    },
  },
);
