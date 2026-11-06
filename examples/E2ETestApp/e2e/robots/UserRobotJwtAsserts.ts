import { UserRobot } from './UserRobot';

import { sleep, waitToAppear, waitToAppearAndClick } from '../support/Element';

declare module './UserRobot' {
  interface UserRobot {
    tapOnConnectionButton(): this;
    /** The client is connected (after a token refresh, when one was needed). */
    assertConnectionStatus(): this;
    /** The connection dropped once the token expired, as Android's `statusOffline` assert. */
    assertTokenHasExpired(): this;
    /** The mock server's valid token expires 5s after it is issued. */
    waitForTokenToExpire(): this;
  }
}

const jwtTimeout = 15000;

UserRobot.prototype.tapOnConnectionButton = function () {
  return this.perform(() => waitToAppearAndClick(by.id('jwt-connection-button')));
};

UserRobot.prototype.assertConnectionStatus = function () {
  return this.perform(() =>
    waitToAppear(by.id('jwt-connection-status-connected'), { timeout: jwtTimeout }),
  );
};

UserRobot.prototype.assertTokenHasExpired = function () {
  return this.perform(() =>
    waitToAppear(by.id('jwt-has-been-disconnected-true'), { timeout: jwtTimeout }),
  );
};

UserRobot.prototype.waitForTokenToExpire = function () {
  return this.perform(() => sleep(5000));
};
