import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { useCanEdit } from '../useCanEdit';
import { useChannelOwnCapabilities } from '../useChannelOwnCapabilities';

jest.mock('../useChannelOwnCapabilities');

const mockedUseChannelOwnCapabilities = useChannelOwnCapabilities as jest.MockedFunction<
  typeof useChannelOwnCapabilities
>;

const channel = {} as Channel;

describe('useCanEdit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the user can update the channel', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(['update-channel']);

    const { result } = renderHook(() => useCanEdit(channel));

    expect(result.current).toBe(true);
  });

  it('returns false when the update-channel capability is missing', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue([]);

    const { result } = renderHook(() => useCanEdit(channel));

    expect(result.current).toBe(false);
  });

  it('returns false when there is no channel', () => {
    mockedUseChannelOwnCapabilities.mockReturnValue(undefined);

    const { result } = renderHook(() => useCanEdit());

    expect(result.current).toBe(false);
  });
});
