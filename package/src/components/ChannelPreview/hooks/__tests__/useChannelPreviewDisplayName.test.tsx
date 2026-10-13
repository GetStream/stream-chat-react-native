import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import * as useChannelNameModule from '../../../../hooks/useChannelName';
import { useChannelPreviewDisplayName } from '../useChannelPreviewDisplayName';

const OWN_USER_ID = 'me';

const members = (online: boolean, name = 'Other User') => ({
  [OWN_USER_ID]: { user: { id: OWN_USER_ID, name: 'Me' } },
  other: { user: { id: 'other', name, online } },
});

describe('useChannelPreviewDisplayName', () => {
  let state: StateStore<{ members: ReturnType<typeof members> }>;
  let channel: Channel;

  beforeEach(() => {
    state = new StateStore({ members: members(false) });
    channel = { cid: 'messaging:test', state } as unknown as Channel;
    jest
      .spyOn(ChatContext, 'useChatContext')
      .mockImplementation(
        () => ({ client: { userID: OWN_USER_ID } }) as unknown as ChatContextValue,
      );
    jest.spyOn(useChannelNameModule, 'useChannelName').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not re-render when only a presence changes', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useChannelPreviewDisplayName(channel);
    });
    const rendersBefore = renders;

    act(() => state.next({ members: members(true) }));

    expect(result.current).toBe('Other User');
    expect(renders).toBe(rendersBefore);
  });

  it('shows the new name when the other member is renamed', () => {
    const { result } = renderHook(() => useChannelPreviewDisplayName(channel));

    act(() => state.next({ members: members(false, 'Renamed User') }));

    expect(result.current).toBe('Renamed User');
  });
});
