import { Alert, AlertButton } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel, Mute } from 'stream-chat';

import * as useMutedUsersModule from '../../../components/ChannelList/hooks/useMutedUsers';
import * as useIsChannelMutedModule from '../../../components/ChannelPreview/hooks/useIsChannelMuted';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../contexts/translationContext/TranslationContext';
import * as useChannelMembershipStateModule from '../../useChannelMembershipState';
import * as useIsDirectChatModule from '../../useIsDirectChat';
import {
  GetChannelActionItems,
  buildDefaultChannelActionItems,
  getChannelActionItems,
  useChannelActionItems,
} from '../useChannelActionItems';
import * as useChannelActionsModule from '../useChannelActions';

const createChannelActions = (): useChannelActionsModule.ChannelActions => ({
  addMembers: jest.fn(),
  removeMembers: jest.fn(),
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
  updateImage: jest.fn(),
  updateName: jest.fn(),
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
        subscribeWithSelector: () => () => {},
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
    jest.spyOn(useIsChannelMutedModule, 'useIsChannelMuted').mockReturnValue({
      createdAt: null,
      expiresAt: null,
      muted: false,
    });
    jest.spyOn(useMutedUsersModule, 'useMutedUsers').mockReturnValue([] as Mute[]);
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(false);
    jest.spyOn(useChannelActionsModule, 'useChannelActions').mockReturnValue(channelActions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns default channel action items', () => {
    const { result } = renderHook(() => useChannelActionItems({ channel, surface: 'list' }));

    expect(result.current).toHaveLength(4);
    expect(result.current.map((item) => item.action)).toEqual([
      channelActions.muteChannel,
      channelActions.pin,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(result.current.map((item) => item.id)).toEqual([
      'mute',
      'pin',
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
      'swipe',
      'sheet',
      'sheet',
      'sheet',
    ]);
  });

  it('returns muteUser only in direct chats', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);

    const { result } = renderHook(() => useChannelActionItems({ channel, surface: 'list' }));

    expect(result.current.map((item) => item.id)).toEqual([
      'mute',
      'muteUser',
      'block',
      'pin',
      'leave',
      'deleteChannel',
    ]);
    expect(result.current.find((item) => item.id === 'muteUser')?.action).toBe(
      channelActions.muteUser,
    );
    expect(result.current.find((item) => item.id === 'muteUser')?.placement).toBe('sheet');
  });

  it('mute action always targets the channel and muteUser toggles independently', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);
    jest.spyOn(useIsChannelMutedModule, 'useIsChannelMuted').mockReturnValue({
      createdAt: null,
      expiresAt: null,
      muted: true,
    });
    jest.spyOn(useMutedUsersModule, 'useMutedUsers').mockReturnValue([] as Mute[]);

    const { result } = renderHook(() => useChannelActionItems({ channel, surface: 'list' }));

    const muteItem = result.current.find((item) => item.id === 'mute');
    const muteUserItem = result.current.find((item) => item.id === 'muteUser');
    expect(muteItem?.action).toBe(channelActions.unmuteChannel);
    expect(muteUserItem?.action).toBe(channelActions.muteUser);
  });

  it('forwards options from item.action to the underlying channel action', async () => {
    const { result } = renderHook(() => useChannelActionItems({ channel, surface: 'list' }));

    const muteItem = result.current.find((item) => item.id === 'mute');
    expect(muteItem).toBeDefined();
    const onSuccess = jest.fn();
    await muteItem?.action({ onSuccess });

    expect(channelActions.muteChannel).toHaveBeenCalledWith({ onSuccess });
  });

  it('marks block as destructive when user is not blocked', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);

    const { result } = renderHook(() => useChannelActionItems({ channel, surface: 'list' }));

    const blockItem = result.current.find((item) => item.id === 'block');
    expect(blockItem?.type).toBe('destructive');
  });

  it('keeps block standard when user is already blocked', () => {
    jest.spyOn(useIsDirectChatModule, 'useIsDirectChat').mockReturnValue(true);
    const blockedChannel = createChannelMock({ blockedUserIds: ['other-user-id'] });

    const { result } = renderHook(() =>
      useChannelActionItems({ channel: blockedChannel, surface: 'list' }),
    );

    const blockItem = result.current.find((item) => item.id === 'block');
    expect(blockItem?.type).toBe('standard');
  });

  it('uses custom getChannelActionItems with context and defaultItems when provided', () => {
    const customGetChannelActionItems = jest.fn(
      ({ defaultItems }: Parameters<GetChannelActionItems>[0]) => defaultItems.slice(0, 1),
    );

    const { result } = renderHook(() =>
      useChannelActionItems({
        channel,
        getChannelActionItems: customGetChannelActionItems,
        surface: 'list',
      }),
    );

    expect(customGetChannelActionItems).toHaveBeenCalledWith({
      context: {
        actions: channelActions,
        channel,
        channelMuteActive: false,
        isArchived: false,
        isBlocked: undefined,
        isDirectChat: false,
        isPinned: false,
        surface: 'list',
        t: expect.any(Function),
        userMuteActive: false,
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
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });
    const actionItems = getChannelActionItems({
      context: {
        actions: channelActions,
        channel,
        channelMuteActive: false,
        isArchived: false,
        isBlocked: undefined,
        isDirectChat: false,
        isPinned: false,
        surface: 'list',
        t: ((value: string) => value) as TranslationContextValue['t'],
        userMuteActive: false,
      },
      defaultItems,
    });

    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.muteChannel,
      channelActions.pin,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(actionItems.map((item) => item.id)).toEqual(['mute', 'pin', 'leave', 'deleteChannel']);
    expect(actionItems.map((item) => item.type)).toEqual([
      'standard',
      'standard',
      'destructive',
      'destructive',
    ]);
  });

  it('returns direct-chat variants for mute and block states', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel: createChannelMock({ blockedUserIds: ['other-user-id'] }),
      channelMuteActive: true,
      isArchived: true,
      isBlocked: true,
      isDirectChat: true,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: true,
    });

    expect(actionItems.map((item) => item.id)).toEqual([
      'mute',
      'muteUser',
      'block',
      'pin',
      'leave',
      'deleteChannel',
    ]);
    expect(actionItems.map((item) => item.action)).toEqual([
      channelActions.unmuteChannel,
      channelActions.unmuteUser,
      channelActions.unblockUser,
      channelActions.pin,
      channelActions.leave,
      expect.any(Function),
    ]);
    expect(actionItems.map((item) => item.label)).toEqual([
      'Unmute Chat',
      'Unmute User',
      'Unblock User',
      'Pin Chat',
      'Leave Chat',
      'Delete Chat',
    ]);
    expect(actionItems.map((item) => item.placement)).toEqual([
      'swipe',
      'sheet',
      'sheet',
      'sheet',
      'sheet',
      'sheet',
    ]);
  });

  it('omits muteUser when not a direct chat', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems.map((item) => item.id)).not.toContain('muteUser');
  });

  it('omits delete action when current user is not the channel creator', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel: createChannelMock({ createdById: 'someone-else' }),
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems.map((item) => item.id)).toEqual(['mute', 'pin', 'leave']);
  });

  it('uses group mute variants for labels and placements', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      channelMuteActive: true,
      isArchived: true,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems[0].action).toBe(channelActions.unmuteChannel);
    expect(actionItems[0].label).toBe('Unmute Group');
    expect(actionItems[0].placement).toBe('swipe');

    const leaveItem = actionItems.find((item) => item.id === 'leave');
    expect(leaveItem?.action).toBe(channelActions.leave);
    expect(leaveItem?.label).toBe('Leave Group');
    expect(leaveItem?.placement).toBe('sheet');
  });

  it('pin item toggles to unpin when channel is pinned', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: true,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    const pinItem = actionItems.find((item) => item.id === 'pin');
    expect(pinItem?.action).toBe(channelActions.unpin);
    expect(pinItem?.label).toBe('Unpin Group');
    expect(pinItem?.placement).toBe('sheet');
  });

  it('pin item uses direct-chat label variant', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: true,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    const pinItem = actionItems.find((item) => item.id === 'pin');
    expect(pinItem?.action).toBe(channelActions.pin);
    expect(pinItem?.label).toBe('Pin Chat');
  });

  it('omits the pin item when building for the details surface', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'details',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems.map((item) => item.id)).not.toContain('pin');
  });

  it('includes the pin item when building for the list surface', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems.map((item) => item.id)).toContain('pin');
  });

  it('applies no surface-specific filtering when surface is omitted', () => {
    const actionItems = buildDefaultChannelActionItems({
      actions: createChannelActions(),
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(actionItems.map((item) => item.id)).toEqual(['mute', 'pin', 'leave', 'deleteChannel']);
  });

  it('mute and muteUser reflect their respective active states independently', () => {
    const channelActions = createChannelActions();
    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: true,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: true,
    });

    const muteItem = actionItems.find((item) => item.id === 'mute');
    const muteUserItem = actionItems.find((item) => item.id === 'muteUser');

    expect(muteItem?.action).toBe(channelActions.muteChannel);
    expect(muteItem?.label).toBe('Mute Chat');
    expect(muteUserItem?.action).toBe(channelActions.unmuteUser);
    expect(muteUserItem?.label).toBe('Unmute User');
  });

  it('shows delete confirmation and calls deleteChannel on destructive confirm', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const channelActions = createChannelActions();

    const actionItems = buildDefaultChannelActionItems({
      actions: channelActions,
      channel,
      channelMuteActive: false,
      isArchived: false,
      isBlocked: undefined,
      isDirectChat: false,
      isPinned: false,
      surface: 'list',
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    const deleteItem = actionItems.find((item) => item.id === 'deleteChannel');
    expect(deleteItem).toBeDefined();
    const onSuccess = jest.fn();
    await deleteItem?.action({ onSuccess });

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
    expect(channelActions.deleteChannel).toHaveBeenCalledWith({ onSuccess });

    alertSpy.mockRestore();
  });
});
