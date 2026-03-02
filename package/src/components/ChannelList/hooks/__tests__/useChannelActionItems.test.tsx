import React, { isValidElement } from 'react';
import { View } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { getChannelActionItems, useChannelActionItems } from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';

describe('useChannelActionItems', () => {
  const channel = {} as Channel;

  const channelActions: useChannelActionsModule.ChannelActions = {
    archiveUnarchive: jest.fn(),
    deleteChannel: jest.fn(),
    leave: jest.fn(),
    pinUnpin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useChannelActionsModule, 'useChannelActions').mockReturnValue(channelActions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns default channel action items', () => {
    const { result } = renderHook(() => useChannelActionItems({ channel }));

    expect(result.current).toHaveLength(4);
    expect(result.current.map((item) => item.action)).toEqual([
      channelActions.pinUnpin,
      channelActions.archiveUnarchive,
      channelActions.leave,
      channelActions.deleteChannel,
    ]);
    expect(result.current.every((item) => item.label === '')).toBe(true);
    expect(
      result.current.every((item) => isValidElement(item.Icon) && item.Icon.type === View),
    ).toBe(true);
    expect(result.current.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'standard',
      'destructive',
    ]);
  });

  it('uses custom getChannelActionItems when provided', () => {
    const customGetChannelActionItems = jest.fn(() => [
      {
        action: channelActions.leave,
        Icon: <View testID='custom-icon' />,
        label: 'custom',
        type: 'standard',
      },
    ]);

    const { result } = renderHook(() =>
      useChannelActionItems({
        channel,
        getChannelActionItems: customGetChannelActionItems,
      }),
    );

    expect(customGetChannelActionItems).toHaveBeenCalledWith(channelActions);
    expect(result.current).toHaveLength(1);
    expect(result.current[0].action).toBe(channelActions.leave);
    expect(result.current[0].label).toBe('custom');
    expect(result.current[0].type).toBe('standard');
  });
});

describe('getChannelActionItems', () => {
  it('creates action items in default order', () => {
    const channelActions: useChannelActionsModule.ChannelActions = {
      archiveUnarchive: jest.fn(),
      deleteChannel: jest.fn(),
      leave: jest.fn(),
      pinUnpin: jest.fn(),
    };

    const actionItems = getChannelActionItems(channelActions);

    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.pinUnpin,
      channelActions.archiveUnarchive,
      channelActions.leave,
      channelActions.deleteChannel,
    ]);
    expect(actionItems.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'standard',
      'destructive',
    ]);
  });
});
