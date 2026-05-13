import jsEslint from '@eslint/js';
import eslintReactNativeConfig from '@react-native/eslint-config';
import eslintPluginReactNativeOfficial from '@react-native/eslint-plugin';
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
 * @react-native/eslint-config stores globals as `true`/`false`. We rebuild the
 * map with `'readonly'` so flat config accepts them.
 */
const reactNativeGlobals = Object.keys(eslintReactNativeConfig.globals ?? {}).reduce((acc, key) => {
  if (eslintReactNativeConfig.globals[key]) {
    acc[key] = 'readonly';
  }
  return acc;
}, {});

const reactNativeRules = Object.fromEntries(
  Object.entries(eslintReactNativeConfig.rules ?? {}).filter(([key]) => !key.startsWith('jest/')),
);

export default tsEslint.config(
  jsEslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  {
    ignores: [
      // Dependencies and build outputs
      '**/node_modules/',
      '**/build/',
      '**/dist/',
      '**/lib/',
      '**/.expo/',
      '**/.gradle/',
      '**/vendor/',
      '**/coverage/',
      '**/ios/build/',
      '**/ios/Pods/',
      '**/android/build/',
      '**/android/app/build/',

      // Native scaffolding (not source we lint)
      '**/ios/',
      '**/android/',
      '**/fastlane/',

      // Generated SDK assets
      'package/src/components/docs/',
      'package/src/theme/generated/',

      // Jest snapshots (auto-generated)
      '**/__snapshots__/',
      '**/*.snap',

      // JSON is formatted by Prettier, not linted by ESLint
      '**/*.json',

      // Markdown is not linted (core has historically excluded it)
      '**/*.md',

      // Tooling config files
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/jest-setup.*',

      // Workspaces / dirs not previously in lint scope
      'package/native-package/',
      'package/expo-package/',
      'release/',

      // Repo metadata
      '.github/',
      '.husky/',
      'dotgit/',
      '.claude/',
      'ai-docs/',
      'docs/',
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
      '@react-native': eslintPluginReactNativeOfficial,
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
          extensions: [
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.ios.ts',
            '.android.ts',
            '.web.ts',
            '.ios.tsx',
            '.android.tsx',
            '.web.tsx',
          ],
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
      // TypeScript already catches unresolved imports; the eslint-import-resolver-node
      // resolver doesn't understand Yarn workspace hoisting or TS path aliases, so we
      // turn this off repo-wide to avoid false positives in example apps.
      'import/no-unresolved': 'off',
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
      'react/prop-types': 0,
      'require-await': 2,
      semi: [1, 'always'],
      'valid-typeof': 2,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          ignoreRestSiblings: false,
          caughtErrors: 'none',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
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
    files: ['**/__tests__/**', '**/*.test.*', 'package/src/mock-builders/**'],
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
