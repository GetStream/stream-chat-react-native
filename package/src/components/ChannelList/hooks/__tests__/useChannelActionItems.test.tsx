import React, { isValidElement } from 'react';
import { View } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { getChannelActionItems, useChannelActionItems } from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';

describe('useChannelActionItems', () => {
  const channel = {} as Channel;

  const channelActions: useChannelActionsModule.ChannelActions = {
    archive: jest.fn(),
    deleteChannel: jest.fn(),
    leave: jest.fn(),
    pin: jest.fn(),
    unarchive: jest.fn(),
    unpin: jest.fn(),
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

    expect(result.current).toHaveLength(6);
    expect(result.current.map((item) => item.action)).toEqual([
      channelActions.pin,
      channelActions.unpin,
      channelActions.archive,
      channelActions.unarchive,
      channelActions.leave,
      channelActions.deleteChannel,
    ]);
    expect(result.current.map((item) => item.id)).toEqual([
      'pin',
      'unpin',
      'archive',
      'unarchive',
      'leave',
      'deleteChannel',
    ]);
    expect(result.current.every((item) => item.label === '')).toBe(true);
    expect(
      result.current.every((item) => isValidElement(item.Icon) && item.Icon.type === View),
    ).toBe(true);
    expect(result.current.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'standard',
      'standard',
      'destructive',
      'destructive',
    ]);
  });

  it('uses custom getChannelActionItems when provided', () => {
    const customGetChannelActionItems = jest.fn(() => [
      {
        action: channelActions.leave,
        Icon: <View testID='custom-icon' />,
        id: 'leave',
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

    expect(customGetChannelActionItems).toHaveBeenCalledWith({
      channel,
      ...channelActions,
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].action).toBe(channelActions.leave);
    expect(result.current[0].id).toBe('leave');
    expect(result.current[0].label).toBe('custom');
    expect(result.current[0].type).toBe('standard');
  });
});

describe('getChannelActionItems', () => {
  const channel = {} as Channel;

  it('creates action items in default order', () => {
    const channelActions: useChannelActionsModule.ChannelActions = {
      archive: jest.fn(),
      deleteChannel: jest.fn(),
      leave: jest.fn(),
      pin: jest.fn(),
      unarchive: jest.fn(),
      unpin: jest.fn(),
    };

    const actionItems = getChannelActionItems({
      channel,
      ...channelActions,
    });

    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.pin,
      channelActions.unpin,
      channelActions.archive,
      channelActions.unarchive,
      channelActions.leave,
      channelActions.deleteChannel,
    ]);
    expect(actionItems.map((item) => item.id)).toEqual([
      'pin',
      'unpin',
      'archive',
      'unarchive',
      'leave',
      'deleteChannel',
    ]);
    expect(actionItems.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'standard',
      'standard',
      'destructive',
      'destructive',
    ]);
  });
});
