import jsEslint from '@eslint/js';
import eslintReactNativeConfig from '@react-native-community/eslint-config';
import eslintPluginReactNativeOfficial from '@react-native-community/eslint-plugin';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactNative from 'eslint-plugin-react-native';

import tsEslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * @react-native-community/eslint-config is for some reason still using the old notation
 * for globals. We parse them manually here to make sure they're compatible with
 * the new config. All globals are now readonly to prevent them from causing trouble.
 */
const reactNativeGlobals = Object.keys(eslintReactNativeConfig.globals).reduce((acc, key) => {
  acc[key] = 'readonly';
  return acc;
}, {});

/**
 * We filter out the jest/ rules as they're part of another config layer.
 */
const reactNativeRules = Object.keys(eslintReactNativeConfig.rules).reduce((acc, key) => {
  if (!key.startsWith('jest/')) {
    acc[key] = eslintReactNativeConfig.rules[key];
  }
  return acc;
}, {});

export default tsEslint.config(
  jsEslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  {
    ignores: [
      'node_modules/',
      'build/',
      'dist/',
      '.expo/',
      'vendor/',
      '*.md',
      'src/components/docs/',
      'lib/',
    ],
  },
  {
    name: 'default',
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: reactNativeGlobals,
      parser: tsEslint.parser,
      parserOptions: {
        ecmaFeatures: {
          modules: true,
          jsx: true,
        },
      },
      sourceType: 'module',
    },
    plugins: {
      '@react-native-community': eslintPluginReactNativeOfficial,
      'eslint-comments': eslintPluginComments,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'react-native': eslintPluginReactNative,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          paths: ['src'],
        },
      },
      'import/ignore': ['react-native'],
      react: {
        pragma: 'React',
        version: 'detect',
      },
    },
    rules: {
      ...reactNativeRules,
      ...eslintConfigPrettier.rules,
      'no-undef': 'off',
      'prettier/prettier': 'warn',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'array-callback-return': 2,
      'comma-dangle': 0,
      'default-case': 2,
      eqeqeq: [2, 'smart'],
      'import/no-unresolved': ['error', { ignore: ['types'] }],
      'import/order': [
        'error',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: ['builtin', 'external', 'internal', 'sibling', 'parent', 'index', 'object'],
          'newlines-between': 'always-and-inside-groups',
          pathGroups: [
            {
              group: 'external',
              pattern: 'react*',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react*'],
        },
      ],
      'jsx-quotes': ['error', 'prefer-single'],
      'linebreak-style': [2, 'unix'],
      'no-console': 0,
      'no-mixed-spaces-and-tabs': 1,
      'no-self-compare': 2,
      'no-underscore-dangle': [2, { allowAfterThis: true }],
      'no-unused-vars': 'off',
      'no-useless-concat': 2,
      'no-var': 2,
      'object-shorthand': 1,
      'prefer-const': 1,
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: false,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: false,
          shorthandFirst: false,
          shorthandLast: false,
        },
      ],
      'react/prop-types': 0,
      'require-await': 2,
      semi: [1, 'always'],
      'sort-imports': [
        'error',
        {
          allowSeparatedGroups: true,
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
      'sort-keys': ['error', 'asc', { caseSensitive: false, minKeys: 2, natural: false }],
      'valid-typeof': 2,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { ignoreRestSiblings: false, caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/exhaustive-deps': 1,
      'react-native/no-inline-styles': 0,
      'babel/no-invalid-this': 0,
      '@typescript-eslint/no-invalid-this': 'error',
      'no-shadow': 0,
    },
  },
  {
    name: 'jest',
    files: ['src/**/__tests__/**', '**/*.test.*', 'src/mock-builders/**'],
    plugins: { jest: eslintPluginJest },
    languageOptions: {
      globals: {
        ...eslintPluginJest.environments.globals.globals,
        jest: 'readonly',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'jest/expect-expect': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/prefer-inline-snapshots': 'off',
      'jest/lowercase-name': 'off',
      'jest/prefer-expect-assertions': 'off',
      'jest/no-hooks': 'off',
      'jest/no-if': 'off',
      'jest/prefer-spy-on': 'off',
    },
  },
);
