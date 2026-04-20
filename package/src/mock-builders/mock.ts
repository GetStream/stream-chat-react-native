/* eslint no-underscore-dangle: 0 */
/* eslint no-param-reassign: 0 */

import { StreamChat, type OwnUserResponse, type UserResponse } from 'stream-chat';

const apiKey = 'API_KEY';
const token = 'dummy_token';

type MockClientOptions = { disableAppSettings?: boolean };

// Tests reach into private/internal StreamChat fields to set up a mocked
// authenticated client without going through the real network handshake.
type MockableStreamChat = StreamChat & {
  connectionId?: string;
  user?: OwnUserResponse;
  _user?: OwnUserResponse;
  userToken?: string;
  setUser?: (user: UserResponse) => Promise<void>;
  wsPromise?: Promise<unknown>;
  _setToken?: (...args: unknown[]) => unknown;
  _setupConnection?: (...args: unknown[]) => unknown;
};

export const setUser = (client: StreamChat, user: UserResponse): Promise<void> =>
  new Promise<void>((resolve) => {
    const c = client as MockableStreamChat;
    c.connectionId = 'dumm_connection_id';
    c.user = { ...user, mutes: [] } as unknown as OwnUserResponse;
    c._user = { ...c.user };
    c.userID = user.id;
    c.userToken = token;
    resolve();
  });

function mockClient(client: StreamChat, options: MockClientOptions = {}): StreamChat {
  const { disableAppSettings = true } = options;
  const c = client as MockableStreamChat;

  jest.spyOn(c as unknown as Record<string, unknown>, '_setToken' as never).mockImplementation();
  jest
    .spyOn(c as unknown as Record<string, unknown>, '_setupConnection' as never)
    .mockImplementation();
  c.tokenManager = {
    getToken: jest.fn(() => token),
    tokenReady: jest.fn(() => true),
  } as unknown as StreamChat['tokenManager'];
  c.setUser = setUser.bind(null, client);

  if (disableAppSettings) {
    c.getAppSettings = jest.fn(() => ({})) as unknown as StreamChat['getAppSettings'];
  }

  return client;
}

export const getTestClient = (options: MockClientOptions = {}): StreamChat =>
  mockClient(new StreamChat(apiKey), options);

export const getTestClientWithUser = async (
  user: UserResponse,
  options: MockClientOptions = {},
): Promise<StreamChat> => {
  const { disableAppSettings = true } = options;
  const client = mockClient(new StreamChat(apiKey));
  await setUser(client, user);
  (client as MockableStreamChat).wsPromise = Promise.resolve();

  if (disableAppSettings) {
    client.getAppSettings = jest.fn(() => ({})) as unknown as StreamChat['getAppSettings'];
  }

  return client;
};

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
};
