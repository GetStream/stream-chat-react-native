import { Alert, AlertButton } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import type { TranslationContextValue } from '../../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../../contexts/translationContext/TranslationContext';
import {
  GetChannelActionItems,
  buildDefaultChannelActionItems,
  getChannelActionItems,
  useChannelActionItems,
} from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';
import * as useChannelMembershipStateModule from '../useChannelMembershipState';
import * as useChannelMuteActiveModule from '../useChannelMuteActive';
import * as useIsDirectChatModule from '../useIsDirectChat';

const createChannelActions = (): useChannelActionsModule.ChannelActions => ({
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
});

const createChannelMock = (params?: {
  blockedUserIds?: string[];
  createdById?: string;
  ownUserId?: string;
}): Channel => {
  const {
    blockedUserIds = [],
    createdById = 'current-user-id',
    ownUserId = 'current-user-id',
  } = params ?? {};
  return {
    data: {
      created_by: {
        id: createdById,
      },
    },
    getClient: () => ({
      blockedUsers: {
        getLatestValue: () => ({ userIds: blockedUserIds }),
      },
      userID: ownUserId,
    }),
    state: {
      members: {
        own: { user: { id: ownUserId } },
        other: { user: { id: 'other-user-id' } },
      },
    },
  } as unknown as Channel;
};

describe('useChannelActionItems', () => {
  const channel = createChannelMock();

  const channelActions = createChannelActions();

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
    const customGetChannelActionItems = jest.fn(
      ({ defaultItems }: Parameters<GetChannelActionItems>[0]) => defaultItems.slice(0, 1),
    );

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
  const channel = createChannelMock();

  it('creates action items in default order', () => {
    const channelActions = createChannelActions();

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

  it('returns direct-chat variants for mute, block and archive states', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel: createChannelMock({ blockedUserIds: ['other-user-id'] }),
      isArchived: true,
      isDirectChat: true,
      isPinned: false,
      muteActive: true,
      t: (value) => value,
    });

    expect(actionItems.map((item) => item.id)).toEqual([
      'mute',
      'block',
      'archive',
      'leave',
      'deleteChannel',
    ]);
    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.unmuteUser,
      channelActions.unblockUser,
      channelActions.unarchive,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(actionItems.map((item) => item.label)).toEqual([
      'Unmute User',
      'Unblock User',
      'Unarchive Chat',
      'Leave Chat',
      'Delete Chat',
    ]);
    expect(actionItems.map((item) => item.placement)).toEqual([
      'sheet',
      'sheet',
      'sheet',
      'sheet',
      'sheet',
    ]);
  });

  it('omits delete action when current user is not the channel creator', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel: createChannelMock({ createdById: 'someone-else' }),
      isArchived: false,
      isDirectChat: false,
      isPinned: false,
      muteActive: false,
      t: (value) => value,
    });

    expect(actionItems.map((item) => item.id)).toEqual(['mute', 'archive', 'leave']);
  });

  it('uses group variants for mute and archive labels and placements', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      isArchived: true,
      isDirectChat: false,
      isPinned: false,
      muteActive: true,
      t: (value) => value,
    });

    expect(actionItems[0].action).toBe(channelActions.unmuteChannel);
    expect(actionItems[0].label).toBe('Unmute Group');
    expect(actionItems[0].placement).toBe('both');

    expect(actionItems[1].action).toBe(channelActions.unarchive);
    expect(actionItems[1].label).toBe('Unarchive Group');
    expect(actionItems[1].placement).toBe('both');
  });

  it('shows delete confirmation and calls deleteChannel on destructive confirm', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const channelActions = createChannelActions();

    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      isArchived: false,
      isDirectChat: false,
      isPinned: false,
      muteActive: false,
      t: (value) => value,
    });

    const deleteItem = actionItems.find((item) => item.id === 'deleteChannel');
    expect(deleteItem).toBeDefined();
    deleteItem?.action();

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete group',
      "Are you sure you want to delete this group? This can't be undone.",
      expect.any(Array),
    );

    const buttons = (alertSpy.mock.calls[0]?.[2] ?? []) as AlertButton[];
    const destructiveButton = buttons.find((button) => button.style === 'destructive');

    expect(destructiveButton?.text).toBe('Delete');
    await destructiveButton?.onPress?.();
    expect(channelActions.deleteChannel).toHaveBeenCalledTimes(1);

    alertSpy.mockRestore();
  });
});
