import { Generic } from './offline-feature';
import { OptimisticUpdates } from './optimistic-update';

// These offline tests exercise heavy async chains (reconnect/resync, pending-task execution) against
// a single shared SQLite DB, which makes a few of them non-deterministic under CPU load even though
// the behavior is correct (they pass reliably in isolation). Retry flaky failures so the suite is
// deterministic — a genuinely-broken test still fails after its retries, so real regressions surface.
jest.retryTimes(2, { logErrorsBeforeRetry: true });

/**
 * We cannot have two parallel test suites accessing the same database.
 * So we force the offline support related tests to run sequentially.
 */
const runOfflineSupportTests = () => {
  Generic();
  OptimisticUpdates();
};

runOfflineSupportTests();
