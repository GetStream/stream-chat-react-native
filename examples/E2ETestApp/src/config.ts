import { LaunchArguments } from 'react-native-launch-arguments';

import type { ClientUser } from 'stream-chat';

/**
 * Launch arguments passed by the Detox suite (`e2e/support/StreamTestCase.ts`). The counterpart of
 * `USE_MOCK_SERVER` + `MOCK_SERVER_*` on iOS and the `BASE_URL` intent extra on Android.
 */
type E2ELaunchArguments = {
  /** Base URL of the per-test `stream-chat-test-mock-server` instance, e.g. `http://localhost:54321`. */
  MOCK_SERVER_URL?: string;
  /** Opens the JWT test screen (token provider + connection status) instead of the chat. */
  JWT_TEST?: boolean | string;
  /** Where to post the e2e coverage on going to the background (`src/e2eCoverage.ts`). */
  E2E_COVERAGE_URL?: string;
};

const launchArguments = LaunchArguments.value<E2ELaunchArguments>();

export const mockServerUrl = launchArguments.MOCK_SERVER_URL;

export const e2eCoverageUrl = launchArguments.E2E_COVERAGE_URL;

export const isJwtTest = launchArguments.JWT_TEST === true || launchArguments.JWT_TEST === 'true';

/** The app user every mock server fixture is recorded for. */
export const appUser: ClientUser = {
  id: 'luke_skywalker',
  image: 'https://vignette.wikia.nocookie.net/starwars/images/2/20/LukeTLJ.jpg',
  name: 'Luke Skywalker',
};

// The mock server accepts any key and token; these match the native SDKs' e2e apps.
export const apiKey = '8br4watad788';
export const appUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibHVrZV9za3l3YWxrZXIifQ.kFSLHRB5X62t0Zlc7nwczWUfsQMwfkpylC6jCUZ6Mc0';
