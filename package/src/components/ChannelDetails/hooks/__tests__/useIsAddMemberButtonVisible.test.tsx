import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from '../../../../hooks/useChannelOwnCapabilities';
import { useIsAddMemberButtonVisible } from '../useIsAddMemberButtonVisible';

jest.mock('../../../../hooks/useChannelOwnCapabilities');

const mockedUseChannelOwnCapabilities = useChannelOwnCapabilities as jest.MockedFunction<
  typeof useChannelOwnCapabilities
>;

const channel = {} as Channel;

describe('useIsAddMemberButtonVisible', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the user can update channel members', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(['update-channel-members']);

    const { result } = renderHook(() => useIsAddMemberButtonVisible(channel));

    expect(result.current).toBe(true);
  });

  it('returns false when the update-channel-members capability is missing', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue([]);

    const { result } = renderHook(() => useIsAddMemberButtonVisible(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when there is no channel', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(undefined);

    const { result } = renderHook(() => useIsAddMemberButtonVisible());

    expect(result.current).toBe(false);
  });
});
