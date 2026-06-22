import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useChannelOwnCapabilities } from '../../../../hooks/useChannelOwnCapabilities';
import { useIsDirectChat } from '../../../../hooks/useIsDirectChat';
import { useIsEditButtonVisible } from '../useIsEditButtonVisible';

jest.mock('../../../../hooks/useChannelOwnCapabilities');
jest.mock('../../../../hooks/useIsDirectChat');

const mockedUseChannelOwnCapabilities = useChannelOwnCapabilities as jest.MockedFunction<
  typeof useChannelOwnCapabilities
>;
const mockedUseIsDirectChat = useIsDirectChat as jest.MockedFunction<typeof useIsDirectChat>;

const channel = {} as Channel;

describe('useIsEditButtonVisible', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the user can update the channel and it is not a direct chat', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(['update-channel']);
    mockedUseIsDirectChat.mockReturnValue(false);

    const { result } = renderHook(() => useIsEditButtonVisible(channel));

    expect(result.current).toBe(true);
  });

  it('returns false for a direct chat even with the update-channel capability', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(['update-channel']);
    mockedUseIsDirectChat.mockReturnValue(true);

    const { result } = renderHook(() => useIsEditButtonVisible(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when the update-channel capability is missing', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue([]);
    mockedUseIsDirectChat.mockReturnValue(false);

    const { result } = renderHook(() => useIsEditButtonVisible(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when there is no channel', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(undefined);
    mockedUseIsDirectChat.mockReturnValue(false);

    const { result } = renderHook(() => useIsEditButtonVisible());

    expect(result.current).toBe(false);
  });
});
