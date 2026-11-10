import { AppState } from 'react-native';

import { e2eCoverageUrl } from './config';

type Coverage = Record<string, 0 | 1>;

/**
 * Coverage runs of the e2e suite (`E2E_COVERAGE=1` bundles, `e2e/coverage/babelPlugin.js`): every
 * time the app goes to the background, it posts the source files it has loaded and which of them ran
 * code to the collector in the test process (`e2e/support/Coverage.ts`). The suite sends the app home
 * after each test to collect it.
 */
export const reportE2ECoverage = () => {
  const url = e2eCoverageUrl;
  if (!url) {
    return;
  }
  AppState.addEventListener('change', (state) => {
    // eslint-disable-next-line no-underscore-dangle -- the global the coverage babel plugin writes
    const coverage = (globalThis as { __e2eCoverage?: Coverage }).__e2eCoverage;
    if (state !== 'background' || !coverage) {
      return;
    }
    fetch(url, {
      body: JSON.stringify(coverage),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    }).catch((error) => console.warn('Could not report the e2e coverage', error));
  });
};
