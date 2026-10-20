/** The mock server's app user (`E2E_USER` in `src/utils/e2e.ts`), the only one listed in e2e mode. */
export const appUserId = 'luke_skywalker';

export const LoginPage = {
  get userSelector() {
    return by.id('user-selector-screen');
  },
  get loginButton() {
    return by.id(`user-selector-button-${appUserId}`);
  },
};
