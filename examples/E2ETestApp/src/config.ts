import { LaunchArguments } from 'react-native-launch-arguments';

import type { UserResponse } from 'stream-chat';

/**
 * Launch arguments passed by the Detox suite (`e2e/support/StreamTestCase.ts`). The counterpart of
 * `USE_MOCK_SERVER` + `MOCK_SERVER_*` on iOS and the `BASE_URL` intent extra on Android.
 */
type E2ELaunchArguments = {
  /** Base URL of the per-test `stream-chat-test-mock-server` instance, e.g. `http://localhost:54321`. */
  MOCK_SERVER_URL?: string;
};

export const mockServerUrl = LaunchArguments.value<E2ELaunchArguments>().MOCK_SERVER_URL;

/** The app user every mock server fixture is recorded for. */
export const appUser: UserResponse = {
  id: 'luke_skywalker',
  image: 'https://vignette.wikia.nocookie.net/starwars/images/2/20/LukeTLJ.jpg',
  name: 'Luke Skywalker',
};

// The mock server accepts any key and token; these match the native SDKs' e2e apps.
export const apiKey = '8br4watad788';
export const appUserToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibHVrZV9za3l3YWxrZXIifQ.kFSLHRB5X62t0Zlc7nwczWUfsQMwfkpylC6jCUZ6Mc0';
