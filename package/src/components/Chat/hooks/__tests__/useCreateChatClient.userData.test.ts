import { renderHook, waitFor } from '@testing-library/react-native';
import type { StreamChat } from 'stream-chat';

import { useCreateChatClient } from '../useCreateChatClient';

const mockConnectUser = jest.fn(() => Promise.resolve(undefined));
const mockDisconnectUser = jest.fn(() => Promise.resolve());

jest.mock('stream-chat', () => {
  const actual = jest.requireActual('stream-chat');
  class MockStreamChat extends actual.StreamChat {
    constructor(...args: ConstructorParameters<typeof actual.StreamChat>) {
      super(...args);
      this.connectUser = mockConnectUser;
      this.disconnectUser = mockDisconnectUser;
    }
  }
  return { ...actual, StreamChat: MockStreamChat };
});

/**
 * `userData` is handed straight to `client.connectUser`, so it must accept exactly what that does.
 * In stream-chat v10 `OwnUserResponse` / `UserResponse` require server-owned fields (`role`,
 * `created_at`, …), so typing it as those rejected the `{ id, name, image }` every guide shows.
 */
describe('useCreateChatClient userData', () => {
  it('is typed as what client.connectUser accepts', () => {
    // Type half — asserted by construction (this file IS typechecked, via tsconfig.test.json): each
    // assignment fails the build if the two types drift apart in either direction.
    type HookUserData = Parameters<typeof useCreateChatClient>[0]['userData'];
    type ConnectUserData = Parameters<StreamChat['connectUser']>[0];
    const toConnect: ConnectUserData | undefined = undefined as HookUserData | undefined;
    const toHook: HookUserData | undefined = undefined as ConnectUserData | undefined;
    expect([toConnect, toHook]).toEqual([undefined, undefined]);
  });

  it('connects with a minimal client-side user', async () => {
    const userData = { id: 'jane', image: 'https://example.com/jane.png', name: 'Jane' };

    const { unmount } = renderHook(() =>
      useCreateChatClient({ apiKey: 'key', tokenOrProvider: 'token', userData }),
    );

    await waitFor(() => expect(mockConnectUser).toHaveBeenCalledWith(userData, 'token'));

    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    unmount();
    await waitFor(() => expect(mockDisconnectUser).toHaveBeenCalled());
    log.mockRestore();
  });
});
