import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useCanAddMembersToChannel } from '../useCanAddMembersToChannel';
import { useChannelOwnCapabilities } from '../useChannelOwnCapabilities';

jest.mock('../useChannelOwnCapabilities');

const mockedUseChannelOwnCapabilities = useChannelOwnCapabilities as jest.MockedFunction<
  typeof useChannelOwnCapabilities
>;

const channel = {} as Channel;

describe('useCanAddMembersToChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the user can update channel members', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(['update-channel-members']);

    const { result } = renderHook(() => useCanAddMembersToChannel(channel));

    expect(result.current).toBe(true);
  });

  it('returns false when the update-channel-members capability is missing', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue([]);

    const { result } = renderHook(() => useCanAddMembersToChannel(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when there is no channel', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(undefined);

    const { result } = renderHook(() => useCanAddMembersToChannel());

    expect(result.current).toBe(false);
  });
});
