import { afterEach, beforeEach, expect as jestExpect } from '@jest/globals';

import { dismissAnrDialog } from './AndroidSystemDialogs';

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

export const setUpStreamTestCase = (): StreamTestCase => {
  const testCase = new StreamTestCase();

  beforeEach(async () => {
    await testCase.mockServer.start(currentTestName());
    if (device.getPlatform() === 'android') {
      dismissAnrDialog();
    }
    await device.launchApp({
      launchArgs: {
        MOCK_SERVER_URL: testCase.mockServer.appUrl,
        // iOS: Detox's idle tracking can wedge on RN's UIManager shadow queue (its pending-work
        // counter underflows to 2^64-1), leaving the app "busy" until the test times out. Every
        // robot action and assert waits explicitly, like the native XCUITest suites, so it runs
        // without that synchronization. Android's Espresso synchronization stays on.
        detoxEnableSynchronization: device.getPlatform() === 'ios' ? 0 : 1,
      },
      newInstance: true,
      // No `permissions`: the app asks for none, and on iOS Detox applies each one with
      // `applesimutils --restartSB`, restarting SpringBoard per permission on every launch
      // (minutes per test on CI).
    });
  });

  afterEach(async () => {
    await testCase.mockServer.stop();
  });

  return testCase;
};
