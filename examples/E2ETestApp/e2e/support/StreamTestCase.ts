import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect as jestExpect,
  it,
} from '@jest/globals';

import { dismissAnrDialog } from './AndroidSystemDialogs';
import { CoverageCollector } from './Coverage';
import { enableInternetConnection } from './Device';

import { MockServer } from '../mock-server/MockServer';
import { BackendRobot, ParticipantRobot, UserRobot } from '../robots';

/**
 * Per-test fixture, the counterpart of `StreamTestCase` on iOS and Android: before each test it
 * starts a fresh mock server and relaunches the app pointed at it; after each test it stops the
 * server.
 *
 *   describe('MessageListTests', () => {
 *     const { userRobot, participantRobot, backendRobot } = setUpStreamTestCase();
 *     it('test_...', async () => { ... });
 *   });
 */
export class StreamTestCase {
  readonly mockServer = new MockServer();
  readonly userRobot = new UserRobot();
  readonly backendRobot = new BackendRobot(this.mockServer);
  readonly participantRobot = new ParticipantRobot(this.mockServer);
}

/** `describe` + `it` names `MessageListTests test_x` → `test_x`, which names the mock server log. */
const currentTestName = () =>
  (jestExpect.getState().currentTestName ?? 'unknown')
    .split(' ')
    .pop()!
    .replace(/[^\w-]/g, '_');

export type StreamTestCaseOptions = {
  /** Launches the JWT test screen (`src/JwtScreen.tsx`) instead of the chat. */
  jwt?: boolean;
  /**
   * Turns Espresso's idle synchronization off on Android too (iOS never has it). For suites where
   * the app keeps a short timer running, e.g. the slow mode countdown or a toast: Detox counts it as
   * busy and holds every action until it ends.
   */
  synchronization?: boolean;
};

export const setUpStreamTestCase = ({
  jwt = false,
  synchronization = true,
}: StreamTestCaseOptions = {}): StreamTestCase => {
  const testCase = new StreamTestCase();
  const coverage = CoverageCollector.enabled ? new CoverageCollector() : undefined;

  if (coverage) {
    beforeAll(() => coverage.start());
    afterAll(() => coverage.stop());
  }

  beforeEach(async () => {
    coverage?.reset();
    await testCase.mockServer.start(currentTestName());
    if (device.getPlatform() === 'android') {
      dismissAnrDialog();
    }
    await device.launchApp({
      launchArgs: {
        MOCK_SERVER_URL: testCase.mockServer.appUrl,
        ...(jwt ? { JWT_TEST: true } : {}),
        ...(coverage ? { E2E_COVERAGE_URL: coverage.appUrl } : {}),
        // iOS: Detox's idle tracking can wedge on RN's UIManager shadow queue (its pending-work
        // counter underflows to 2^64-1), leaving the app "busy" until the test times out. Every
        // robot action and assert waits explicitly, like the native XCUITest suites, so it runs
        // without that synchronization. Android's Espresso synchronization stays on.
        detoxEnableSynchronization: device.getPlatform() === 'ios' || !synchronization ? 0 : 1,
      },
      newInstance: true,
      // No `permissions`: the app asks for none, and on iOS Detox applies each one with
      // `applesimutils --restartSB`, restarting SpringBoard per permission on every launch
      // (minutes per test on CI).
    });
  });

  afterEach(async () => {
    await testCase.mockServer.stop();
    if (device.getPlatform() === 'android') {
      // A test that failed while offline must not leave the next one without a connection.
      await enableInternetConnection();
    }
    // After the connection is back, so the app can reach the collector.
    await coverage?.collect(jestExpect.getState().testPath!, currentTestName());
  });

  return testCase;
};

/**
 * `it` on Android, `it.skip` on iOS: for tests that cut the device's internet connection, which only
 * Android can do (`support/Device.ts`). The iOS suites toggle the SDK's connection from a debug
 * switch in their test apps instead.
 */
export const itOnAndroid: typeof it = ((name: string, fn: () => Promise<void>, timeout?: number) =>
  device.getPlatform() === 'android'
    ? it(name, fn, timeout)
    : it.skip(name, fn, timeout)) as typeof it;
