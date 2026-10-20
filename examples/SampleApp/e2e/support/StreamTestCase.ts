import { afterEach, beforeEach, expect as jestExpect } from '@jest/globals';

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
    await device.launchApp({
      launchArgs: { MOCK_SERVER_URL: testCase.mockServer.appUrl },
      newInstance: true,
      permissions: { notifications: 'YES', photos: 'YES' },
    });
  });

  afterEach(async () => {
    await testCase.mockServer.stop();
  });

  return testCase;
};
