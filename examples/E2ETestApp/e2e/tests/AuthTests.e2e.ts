import { describe, it } from '@jest/globals';

import {
  disableInternetConnection,
  enableInternetConnection,
  goToBackground,
  goToForeground,
} from '../support/Device';
import { allureId, step } from '../support/step';
import { setUpStreamTestCase } from '../support/StreamTestCase';

/** Token refresh flows, on the JWT test screen (a token provider backed by the mock's `/jwt/get`). */
describe('AuthTests', () => {
  const { backendRobot, userRobot } = setUpStreamTestCase({ jwt: true });

  const userLogsIn = () =>
    step('GIVEN user logs in', () => userRobot.tapOnConnectionButton().assertConnectionStatus());

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenInvalidatesBeforeUserLogsIn', async () => {
    allureId(13043);
    await step('GIVEN token is invalid', () => backendRobot.invalidateToken());
    await step('WHEN user tries to log in', () => userRobot.tapOnConnectionButton());
    await step('THEN app requests a token refresh', () => userRobot.assertConnectionStatus());
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenInvalidatesAfterUserLogsIn', async () => {
    allureId(13044);
    await userLogsIn();
    await step('WHEN token invalidates', () => backendRobot.invalidateToken(10));
    await step('THEN app requests a token refresh', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenDateInvalidatesBeforeUserLogsIn', async () => {
    allureId(13045);
    await step('GIVEN token date is invalid', () => backendRobot.invalidateTokenDate());
    await step('WHEN user tries to log in', () => userRobot.tapOnConnectionButton());
    await step('THEN app requests a token refresh', () => userRobot.assertConnectionStatus());
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenDateInvalidatesAfterUserLogsIn', async () => {
    allureId(13046);
    await userLogsIn();
    await step('WHEN token date invalidates', () => backendRobot.invalidateTokenDate(10));
    await step('THEN app requests a token refresh', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenSignatureInvalidatesBeforeUserLogsIn', async () => {
    allureId(13047);
    await step('GIVEN token signature is invalid', () => backendRobot.invalidateTokenSignature());
    await step('WHEN user tries to log in', () => userRobot.tapOnConnectionButton());
    await step('THEN app requests a token refresh', () => userRobot.assertConnectionStatus());
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenSignatureInvalidatesAfterUserLogsIn', async () => {
    allureId(13048);
    await userLogsIn();
    await step('WHEN token signature invalidates', () => backendRobot.invalidateTokenSignature(10));
    await step('THEN app requests a token refresh', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  it('test_tokenExpiresBeforeUserLogsIn', async () => {
    allureId(13049);
    await step('GIVEN token expires', () => backendRobot.revokeToken());
    await step('WHEN user tries to log in', () => userRobot.tapOnConnectionButton());
    await step('THEN app requests a token refresh', () => userRobot.assertConnectionStatus());
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenExpiresAfterUserLoggedIn', async () => {
    allureId(13050);
    await userLogsIn();
    // The mock's valid token expires on its own 5s after it is issued.
    await step('THEN app requests a token refresh after the token expires', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenExpiresWhenUserIsInBackground', async () => {
    allureId(13051);
    await userLogsIn();
    await step('AND user goes to background', () => goToBackground());
    await step('AND token expires', () => userRobot.waitForTokenToExpire());
    await step('WHEN user comes back to foreground', () => goToForeground());
    await step('THEN app requests a token refresh', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenExpiresWhileUserIsOffline', async () => {
    allureId(13052);
    await userLogsIn();
    await step('AND user goes offline', () => disableInternetConnection());
    await step('WHEN token expires', () => userRobot.waitForTokenToExpire());
    await step('AND user comes back online', () => enableInternetConnection());
    await step('THEN app requests a token refresh', () =>
      userRobot.assertTokenHasExpired().assertConnectionStatus(),
    );
  });

  // https://linear.app/stream/issue/RN-483
  it.skip('test_tokenGenerationFails', async () => {
    allureId(13053);
    await userLogsIn();
    await step('AND JWT generation breaks on server side', () =>
      backendRobot.breakTokenGeneration(),
    );
    await step('WHEN app tries to request a token refresh', () =>
      userRobot.assertTokenHasExpired(),
    );
    await step('THEN app requests a token refresh again once generation recovers', () =>
      userRobot.assertConnectionStatus(),
    );
  });
});
