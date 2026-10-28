/** The mock server's app user (`appUser` in `src/config.ts`), the only one listed in e2e mode. */
export const appUserId = 'luke_skywalker';

export const LoginPage = {
  get userSelector() {
    return by.id('user-selector-screen');
  },
  get loginButton() {
    return by.id(`user-selector-button-${appUserId}`);
  },
};
