const { readFileSync } = require('fs');

/**
 * E2E_SELECTION: the `select_e2e_tests` output (impact analysis, e2e/README.md), whose `tests` are
 * `<test file>/<test>` ids, e.g. `MessageListTests.e2e/test_x`. Runs only those, unless `run_all`.
 */
const selection = () => {
  if (!process.env.E2E_SELECTION) {
    return {};
  }
  const { run_all: runAll, tests } = JSON.parse(readFileSync(process.env.E2E_SELECTION, 'utf8'));
  if (runAll) {
    return {};
  }
  const ids = tests.map((id) => id.split('/'));
  const files = [...new Set(ids.map(([file]) => file))];
  const names = [...new Set(ids.map(([, name]) => name))];
  return {
    testMatch: files.map((file) => `<rootDir>/e2e/tests/${file}.ts`),
    // Full names are `<describe> <test>`; test names are unique words, so match the last one.
    testNamePattern: ` (${names.join('|')})$`,
  };
};

/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/tests/**/*.e2e.ts'],
  ...selection(),
  testTimeout: 180000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'detox/runners/jest/reporter',
    // Kept across Detox's `--retries` runs; the `test_e2e` lane clears it before the first one.
    ['jest-allure2-reporter', { resultsDir: 'allure-results', overwrite: false }],
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  testEnvironmentOptions: {
    eventListeners: [
      'jest-metadata/environment-listener',
      'jest-allure2-reporter/environment-listener',
    ],
  },
  verbose: true,
  transform: {
    '\\.ts$': [
      'babel-jest',
      { babelrc: false, configFile: false, presets: ['module:@react-native/babel-preset'] },
    ],
  },
};
