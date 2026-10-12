import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import type { ChatContextValue } from '../../contexts/chatContext/ChatContext';
import * as ChatContext from '../../contexts/chatContext/ChatContext';
import { useIsDirectChat } from '../useIsDirectChat';

const OWN_USER_ID = 'me';

const members = (online: boolean, ...otherIds: string[]) => ({
  [OWN_USER_ID]: { user: { id: OWN_USER_ID } },
  ...Object.fromEntries(otherIds.map((id) => [id, { user: { id, online } }])),
});

describe('useIsDirectChat', () => {
  let state: StateStore<{ members: ReturnType<typeof members> }>;
  let channel: Channel;

  beforeEach(() => {
    state = new StateStore({ members: members(false, 'other') });
    channel = { cid: 'messaging:test', state } as unknown as Channel;
    jest
      .spyOn(ChatContext, 'useChatContext')
      .mockImplementation(
        () => ({ client: { userID: OWN_USER_ID } }) as unknown as ChatContextValue,
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not re-render when only a presence changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useIsDirectChat(channel);
    });
    const rendersBefore = renders;

    act(() => state.next({ members: members(true, 'other') }));

    expect(result.current).toBe(true);
    expect(renders).toBe(rendersBefore);
  });

  it('turns false when a third member joins', () => {
    const { result } = renderHook(() => useIsDirectChat(channel));

    act(() => state.next({ members: members(false, 'other', 'third') }));

    expect(result.current).toBe(false);
  });
});
