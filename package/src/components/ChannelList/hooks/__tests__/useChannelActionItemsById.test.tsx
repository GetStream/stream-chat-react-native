import React from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import * as useChannelActionItemsModule from '../useChannelActionItems';
import { useChannelActionItemsById } from '../useChannelActionItemsById';

describe('useChannelActionItemsById', () => {
  const channel = {} as Channel;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns action items mapped by id', () => {
    const channelActionItems: useChannelActionItemsModule.ChannelActionItem[] = [
      {
        action: jest.fn(),
        Icon: <></>,
        id: 'pin',
        label: '',
        placement: 'both',
        type: 'standard',
      },
      {
        action: jest.fn(),
        Icon: <></>,
        id: 'deleteChannel',
        label: '',
        placement: 'both',
        type: 'destructive',
      },
    ];

    jest
      .spyOn(useChannelActionItemsModule, 'useChannelActionItems')
      .mockReturnValue(channelActionItems);

    const { result } = renderHook(() => useChannelActionItemsById({ channel }));

    expect(result.current.pin).toBe(channelActionItems[0]);
    expect(result.current.deleteChannel).toBe(channelActionItems[1]);
    expect(result.current.unarchive).toBeUndefined();
  });

  it('passes getChannelActionItems through to useChannelActionItems', () => {
    const getChannelActionItems = jest.fn();

    const useChannelActionItemsSpy = jest
      .spyOn(useChannelActionItemsModule, 'useChannelActionItems')
      .mockReturnValue([]);

    renderHook(() =>
      useChannelActionItemsById({
        channel,
        getChannelActionItems,
      }),
    );

    expect(useChannelActionItemsSpy).toHaveBeenCalledWith({
      channel,
      getChannelActionItems,
    });
  });
});
