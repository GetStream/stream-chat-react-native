import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../../contexts/translationContext/TranslationContext';
import {
  buildDefaultChannelActionItems,
  getChannelActionItems,
  useChannelActionItems,
} from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';
import * as useChannelMembershipStateModule from '../useChannelMembershipState';
import * as useChannelMuteActiveModule from '../useChannelMuteActive';
import * as useIsDirectChatModule from '../useIsDirectChat';

describe('useChannelActionItems', () => {
  const channel = {
    data: {
      created_by: {
        id: 'current-user-id',
      },
    },
    getClient: () => ({
      blockedUsers: {
        getLatestValue: () => ({ userIds: [] }),
      },
      userID: 'current-user-id',
    }),
  } as unknown as Channel;

  const channelActions: useChannelActionsModule.ChannelActions = {
    archive: jest.fn(),
    blockUser: jest.fn(),
    deleteChannel: jest.fn(),
    leave: jest.fn(),
    muteChannel: jest.fn(),
    muteUser: jest.fn(),
    pin: jest.fn(),
    unarchive: jest.fn(),
    unblockUser: jest.fn(),
    unmuteChannel: jest.fn(),
    unmuteUser: jest.fn(),
    unpin: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(TranslationContext, 'useTranslationContext')
      .mockImplementation(
        () => ({ t: (value: string) => value }) as unknown as TranslationContextValue,
      );
    jest.spyOn(useChannelMembershipStateModule, 'useChannelMembershipState').mockReturnValue({
      archived_at: undefined,
      pinned_at: undefined,
    } as never);
    jest.spyOn(useChannelMuteActiveModule, 'useChannelMuteActive').mockReturnValue(false);
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
    jest.spyOn(useChannelActionsModule, 'useChannelActions').mockReturnValue(channelActions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns default channel action items', () => {
    const { result } = renderHook(() => useChannelActionItems({ channel }));

    expect(result.current).toHaveLength(4);
    expect(result.current.map((item) => item.action)).toEqual([
      channelActions.muteChannel,
      channelActions.archive,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(result.current.map((item) => item.id)).toEqual([
      'mute',
      'archive',
      'leave',
      'deleteChannel',
    ]);
    expect(result.current.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'destructive',
      'destructive',
    ]);
    expect(result.current.map((item) => item.placement)).toEqual([
      'both',
      'both',
      'sheet',
      'sheet',
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
        muteActive: false,
        t: expect.any(Function),
      },
      defaultItems: expect.any(Array),
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].action).toBe(channelActions.muteChannel);
    expect(result.current[0].id).toBe('mute');
    expect(result.current[0].type).toBe('standard');
  });
});

describe('getChannelActionItems', () => {
  const channel = {
    data: {
      created_by: {
        id: 'current-user-id',
      },
    },
    getClient: () => ({
      blockedUsers: {
        getLatestValue: () => ({ userIds: [] }),
      },
      userID: 'current-user-id',
    }),
  } as unknown as Channel;

  it('creates action items in default order', () => {
    const channelActions: useChannelActionsModule.ChannelActions = {
      archive: jest.fn(),
      blockUser: jest.fn(),
      deleteChannel: jest.fn(),
      leave: jest.fn(),
      muteChannel: jest.fn(),
      muteUser: jest.fn(),
      pin: jest.fn(),
      unarchive: jest.fn(),
      unblockUser: jest.fn(),
      unmuteChannel: jest.fn(),
      unmuteUser: jest.fn(),
      unpin: jest.fn(),
    };

    const defaultItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      isArchived: false,
      isDirectChat: false,
      isPinned: false,
      muteActive: false,
      t: (value) => value,
    });
    const actionItems = getChannelActionItems({
      context: {
        actions: channelActions,
        channel,
        isArchived: false,
        isDirectChat: false,
        isPinned: false,
        muteActive: false,
        t: (value) => value,
      },
      defaultItems,
    });

    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.muteChannel,
      channelActions.archive,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(actionItems.map((item) => item.id)).toEqual([
      'mute',
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
