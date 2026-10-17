import React, { PropsWithChildren } from 'react';

import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import type { StreamChat, UserMuteResponse, UserResponse } from 'stream-chat';

import { ChatProvider } from '../../../../contexts/chatContext/ChatContext';
import { useUserMuteActive } from '../useUserMuteActive';

const muteOf = (targetId: string) =>
  ({ target: { id: targetId }, user: { id: 'current-user-id' } }) as UserMuteResponse;

const createClient = () =>
  ({
    mutedUsersStore: new StateStore<{ mutedUsers: UserMuteResponse[] }>({ mutedUsers: [] }),
    userID: 'current-user-id',
  }) as unknown as StreamChat;

describe('useUserMuteActive', () => {
  it('re-renders only when the given user is muted or unmuted', () => {
    const client = createClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <ChatProvider value={{ client } as never}>{children}</ChatProvider>
    );
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders += 1;
        return useUserMuteActive({ id: 'target-user' } as UserResponse);
      },
      { wrapper },
    );
    const rendersAfterMount = renders;

    act(() => client.mutedUsersStore.partialNext({ mutedUsers: [muteOf('someone-else')] }));

    expect(result.current).toBe(false);
    expect(renders).toBe(rendersAfterMount);

    act(() =>
      client.mutedUsersStore.partialNext({
        mutedUsers: [muteOf('someone-else'), muteOf('target-user')],
      }),
    );

    expect(result.current).toBe(true);
    expect(renders).toBe(rendersAfterMount + 1);
  });
});
