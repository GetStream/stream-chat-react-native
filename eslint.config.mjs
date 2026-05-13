import jsEslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginComments from 'eslint-plugin-eslint-comments';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginJest from 'eslint-plugin-jest';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// React Native runtime globals that aren't in the standard `globals` package presets.
const reactNativeGlobals = {
  __DEV__: 'readonly',
};

export default tsEslint.config(
  jsEslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  // Settings that apply to every config object below. Without this, eslint-plugin-react's
  // recommended preset runs with no React version and logs "React version not specified"
  // on every invocation -- `detect` fails because React isn't a direct root dep.
  { settings: { react: { version: '19' } } },
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
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        ...reactNativeGlobals,
      },
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
        // 'detect' fails to find React from the root config location (React isn't a
        // direct root dep), so we pin to the major version used across all workspaces.
        version: '19',
      },
    },
    rules: {
      ...eslintConfigPrettier.rules,

      // -- Silencing recommended-preset rules that don't fit this codebase.
      // These were previously masked by @react-native/eslint-config; we keep them off
      // explicitly to preserve behavior now that the config is owned in-tree.
      'no-constant-condition': 'off',
      'no-empty': 'off',
      'no-inner-declarations': 'off',
      'no-redeclare': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'react/display-name': 'off',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // -- Project conventions.
      'prettier/prettier': 'warn',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'array-callback-return': 'error',
      'comma-dangle': 'off',
      'default-case': 'error',
      eqeqeq: ['error', 'smart'],
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
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-self-compare': 'error',
      'no-shadow': 'off',
      'no-underscore-dangle': ['error', { allowAfterThis: true }],
      'no-useless-concat': 'error',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-const': 'warn',
      'require-await': 'error',
      semi: ['warn', 'always'],
      'valid-typeof': 'error',

      // -- TypeScript-specific.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
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
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-invalid-this': 'error',

      // -- React / React Native.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-native/no-inline-styles': 'off',
      'react/no-unstable-nested-components': 'warn',

      // -- Hygiene rules previously enabled via @react-native/eslint-config that we
      // kept after dropping the package -- they catch real footguns.
      'no-bitwise': 'warn',
      'no-extend-native': 'warn',
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
      'jest/prefer-expect-assertions': 'off',
      'jest/no-hooks': 'off',
      'jest/prefer-spy-on': 'off',
    },
  },
);
