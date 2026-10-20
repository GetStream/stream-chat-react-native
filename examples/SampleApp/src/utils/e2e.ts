import { LaunchArguments } from 'react-native-launch-arguments';

import type { UserResponse } from 'stream-chat';

import type { LoginConfig } from '../types';

/**
 * Launch arguments passed by the Detox e2e suite (`examples/SampleApp/e2e`).
 * The counterpart of `USE_MOCK_SERVER` + `MOCK_SERVER_*` on iOS and the `BASE_URL` intent extra on Android.
 */
type E2ELaunchArguments = {
  /** Base URL of the per-test `stream-chat-test-mock-server` instance, e.g. `http://localhost:54321`. */
  MOCK_SERVER_URL?: string;
};

const launchArguments = LaunchArguments.value<E2ELaunchArguments>();

export const mockServerUrl = launchArguments.MOCK_SERVER_URL;

/**
 * True when the app was launched by the e2e suite. Push registration, notification
 * permission prompts, the stored login and offline storage are all skipped in this mode,
 * so every test starts from the same clean state.
 */
export const isE2eTestRun = !!mockServerUrl;

/** The app user every mock server fixture is recorded for. */
export const E2E_USER: UserResponse = {
  id: 'luke_skywalker',
  image: 'https://vignette.wikia.nocookie.net/starwars/images/2/20/LukeTLJ.jpg',
  name: 'Luke Skywalker',
};

export const E2E_LOGIN_CONFIG: LoginConfig = {
  // The mock server accepts any key; this one matches the native SDKs' e2e apps.
  apiKey: '8br4watad788',
  userId: E2E_USER.id,
  userImage: E2E_USER.image,
  userName: E2E_USER.name,
  userToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibHVrZV9za3l3YWxrZXIifQ.kFSLHRB5X62t0Zlc7nwczWUfsQMwfkpylC6jCUZ6Mc0',
};
