import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMembersState } from '../../components/ChannelList/hooks/useChannelMembersState';
import { useIsChannelMember } from '../useIsChannelMember';

jest.mock('../../components/ChannelList/hooks/useChannelMembersState');

const mockedUseChannelMembersState = useChannelMembersState as jest.MockedFunction<
  typeof useChannelMembersState
>;

const CURRENT_USER_ID = 'current-user-id';
const OTHER_USER_ID = 'other-user-id';

const channel = {} as Channel;

const setMembers = (members: Record<string, ChannelMemberResponse>) => {
  mockedUseChannelMembersState.mockReturnValue(members);
};

describe('useIsChannelMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the user is a member of the channel', () => {
    setMembers({
      [CURRENT_USER_ID]: { user: { id: CURRENT_USER_ID } },
      [OTHER_USER_ID]: { user: { id: OTHER_USER_ID } },
    });

    const { result } = renderHook(() => useIsChannelMember(channel, OTHER_USER_ID));

    expect(result.current).toBe(true);
  });

  it('returns false when the user is not a member of the channel', () => {
    setMembers({
      [CURRENT_USER_ID]: { user: { id: CURRENT_USER_ID } },
    });

    const { result } = renderHook(() => useIsChannelMember(channel, 'unknown-user-id'));

    expect(result.current).toBe(false);
  });

  it('returns false when no userId is provided', () => {
    setMembers({
      [CURRENT_USER_ID]: { user: { id: CURRENT_USER_ID } },
    });

    const { result } = renderHook(() => useIsChannelMember(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when the channel has no members', () => {
    setMembers({});

    const { result } = renderHook(() => useIsChannelMember(channel, OTHER_USER_ID));

    expect(result.current).toBe(false);
  });

  it('passes the channel through to useChannelMembersState', () => {
    setMembers({});

    renderHook(() => useIsChannelMember(channel, OTHER_USER_ID));

    expect(mockedUseChannelMembersState).toHaveBeenCalledWith(channel);
  });
});
