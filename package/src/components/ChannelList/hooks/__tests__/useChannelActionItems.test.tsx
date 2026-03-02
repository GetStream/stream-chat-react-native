import { isValidElement } from 'react';
import { View } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import type { ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import * as ChatContext from '../../../../contexts/chatContext/ChatContext';
import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../../contexts/translationContext/TranslationContext';
import {
  buildDefaultChannelActionItems,
  getChannelActionItems,
  useChannelActionItems,
} from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';
import * as useChannelMembershipStateModule from '../useChannelMembershipState';
import * as useChannelMembersStateModule from '../useChannelMembersState';

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
    jest
      .spyOn(ChatContext, 'useChatContext')
      .mockImplementation(() => ({ client: { userID: 'current-user-id' } }) as ChatContextValue);
    jest
      .spyOn(TranslationContext, 'useTranslationContext')
      .mockImplementation(
        () => ({ t: (value: string) => value }) as unknown as TranslationContextValue,
      );
    jest.spyOn(useChannelMembershipStateModule, 'useChannelMembershipState').mockReturnValue({
      archived_at: undefined,
      pinned_at: undefined,
    } as never);
    jest.spyOn(useChannelMembersStateModule, 'useChannelMembersState').mockReturnValue({});
    jest.spyOn(useChannelActionsModule, 'useChannelActions').mockReturnValue(channelActions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns default channel action items', () => {
    const { result } = renderHook(() => useChannelActionItems({ channel }));

    expect(result.current).toHaveLength(4);
    expect(result.current.map((item) => item.action)).toEqual([
      channelActions.pin,
      channelActions.archive,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(result.current.map((item) => item.id)).toEqual([
      'pin',
      'archive',
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
      'destructive',
      'destructive',
    ]);
  });

  it('uses custom getChannelActionItems with context and defaultItems when provided', () => {
    const customGetChannelActionItems = jest.fn(({ defaultItems }) => defaultItems.slice(0, 1));

    const { result } = renderHook(() =>
      useChannelActionItems({
        channel,
        getChannelActionItems: customGetChannelActionItems,
      }),
    );

    expect(customGetChannelActionItems).toHaveBeenCalledWith({
      context: {
        actions: channelActions,
        channel,
        isArchived: false,
        isDirectChat: false,
        isPinned: false,
        t: expect.any(Function),
      },
      defaultItems: expect.any(Array),
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].action).toBe(channelActions.pin);
    expect(result.current[0].id).toBe('pin');
    expect(result.current[0].label).toBe('');
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

    const defaultItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      isArchived: false,
      isDirectChat: false,
      isPinned: false,
      t: (value) => value,
    });
    const actionItems = getChannelActionItems({
      context: {
        actions: channelActions,
        channel,
        isArchived: false,
        isDirectChat: false,
        isPinned: false,
        t: (value) => value,
      },
      defaultItems,
    });

    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.pin,
      channelActions.archive,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(actionItems.map((item) => item.id)).toEqual([
      'pin',
      'archive',
      'leave',
      'deleteChannel',
    ]);
    expect(actionItems.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'destructive',
      'destructive',
    ]);
  });
});
