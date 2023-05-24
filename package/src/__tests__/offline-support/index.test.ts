import { Generic } from './offline-feature';
import { OptimisticUpdates } from './optimistic-update';

/**
 * We cannot have two parallel test suites accessing the same database.
 * So we force the offline support related tests to run sequentially.
 */
const runOfflineSupportTests = () => {
  Generic();
  OptimisticUpdates();
};

runOfflineSupportTests();
