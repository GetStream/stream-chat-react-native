import React, { PropsWithChildren } from 'react';
import { Alert } from 'react-native';

import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse, Mute } from 'stream-chat';

import * as useMutedUsersModule from '../../../components/ChannelList/hooks/useMutedUsers';
import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../contexts/translationContext/TranslationContext';
import * as useChannelOwnCapabilitiesModule from '../../useChannelOwnCapabilities';
import * as useChannelActionsModule from '../useChannelActions';
import {
  buildDefaultChannelMemberActionItems,
  getChannelMemberActionItems,
  GetChannelMemberActionItems,
  useChannelMemberActionItems,
} from '../useChannelMemberActionItems';
import * as useUserActionsModule from '../useUserActions';

const createUserActions = (): useUserActionsModule.UserActions => ({
  blockUser: jest.fn(),
  muteUser: jest.fn(),
  unblockUser: jest.fn(),
  unmuteUser: jest.fn(),
});

const removeMembers = jest.fn();
const channelActions = { removeMembers } as unknown as useChannelActionsModule.ChannelActions;

const createMemberMock = (userId = 'target-user-id'): ChannelMemberResponse =>
  ({
    user: { id: userId, name: 'Target Name' },
    user_id: userId,
  }) as ChannelMemberResponse;

const createChannelMock = (params?: { blockedUserIds?: string[]; userID?: string }): Channel => {
  const { blockedUserIds = [], userID = 'current-user-id' } = params ?? {};
  return {
    getClient: () => ({
      blockedUsers: {
        getLatestValue: () => ({ userIds: blockedUserIds }),
        subscribeWithSelector: () => () => {},
      },
      userID,
    }),
  } as unknown as Channel;
};

describe('useChannelMemberActionItems', () => {
  const channel = createChannelMock();
  const member = createMemberMock();
  const userActions = createUserActions();

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(TranslationContext, 'useTranslationContext')
      .mockImplementation(
        () => ({ t: (value: string) => value }) as unknown as TranslationContextValue,
      );
    jest.spyOn(useMutedUsersModule, 'useMutedUsers').mockReturnValue([] as Mute[]);
    jest.spyOn(useUserActionsModule, 'useUserActions').mockReturnValue(userActions);
    jest.spyOn(useChannelActionsModule, 'useChannelActions').mockReturnValue(channelActions);
    jest.spyOn(useChannelOwnCapabilitiesModule, 'useChannelOwnCapabilities').mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns default member action items', () => {
    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));

    expect(result.current).toHaveLength(2);
    expect(result.current.map((item) => item.id)).toEqual(['muteUser', 'block']);
    expect(result.current.map((item) => item.action)).toEqual([
      userActions.muteUser,
      userActions.blockUser,
    ]);
    expect(result.current.map((item) => item.type)).toEqual(['standard', 'destructive']);
    expect(result.current.map((item) => item.label)).toEqual(['Mute User', 'Block User']);
  });

  it('returns no action items when the member is the current user', () => {
    const currentUserChannel = createChannelMock({ userID: 'target-user-id' });

    const { result } = renderHook(() =>
      useChannelMemberActionItems({ channel: currentUserChannel, member }),
    );

    expect(result.current).toEqual([]);
  });

  it('toggles muteUser to unmuteUser when the member is already muted', () => {
    jest
      .spyOn(useMutedUsersModule, 'useMutedUsers')
      .mockReturnValue([
        { target: { id: 'target-user-id' }, user: { id: 'current-user-id' } },
      ] as Mute[]);

    const wrapper = ({ children }: PropsWithChildren) => (
      <ChatProvider value={{ client: { userID: 'current-user-id' } } as never}>
        {children}
      </ChatProvider>
    );
    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }), {
      wrapper,
    });

    const muteItem = result.current.find((item) => item.id === 'muteUser');
    expect(muteItem?.action).toBe(userActions.unmuteUser);
    expect(muteItem?.label).toBe('Unmute User');
  });

  it('toggles block to unblockUser when the member is already blocked', () => {
    const blockedChannel = createChannelMock({ blockedUserIds: ['target-user-id'] });

    const { result } = renderHook(() =>
      useChannelMemberActionItems({ channel: blockedChannel, member }),
    );

    const blockItem = result.current.find((item) => item.id === 'block');
    expect(blockItem?.action).toBe(userActions.unblockUser);
    expect(blockItem?.label).toBe('Unblock User');
  });

  it('forwards options from item.action to the underlying user action', async () => {
    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));

    const muteItem = result.current.find((item) => item.id === 'muteUser');
    const onSuccess = jest.fn();
    await muteItem?.action({ onSuccess });

    expect(userActions.muteUser).toHaveBeenCalledWith({ onSuccess });
  });

  it('marks block as destructive when user is not blocked', () => {
    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));

    const blockItem = result.current.find((item) => item.id === 'block');
    expect(blockItem?.type).toBe('destructive');
  });

  it('adds a destructive removeMember item when the user can update channel members', () => {
    jest
      .spyOn(useChannelOwnCapabilitiesModule, 'useChannelOwnCapabilities')
      .mockReturnValue(['update-channel-members']);

    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));

    const removeItem = result.current.find((item) => item.id === 'removeMember');
    expect(result.current.map((item) => item.id)).toEqual(['muteUser', 'block', 'removeMember']);
    expect(removeItem?.label).toBe('Remove User');
    expect(removeItem?.type).toBe('destructive');
  });

  it('does not add removeMember without the update-channel-members capability', () => {
    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));

    expect(result.current.find((item) => item.id === 'removeMember')).toBeUndefined();
  });

  it('does not add removeMember for the current user even with the capability', () => {
    jest
      .spyOn(useChannelOwnCapabilitiesModule, 'useChannelOwnCapabilities')
      .mockReturnValue(['update-channel-members']);
    const currentUserChannel = createChannelMock({ userID: 'target-user-id' });

    const { result } = renderHook(() =>
      useChannelMemberActionItems({ channel: currentUserChannel, member }),
    );

    expect(result.current).toEqual([]);
  });

  it('confirms via Alert before removing the member', () => {
    jest
      .spyOn(useChannelOwnCapabilitiesModule, 'useChannelOwnCapabilities')
      .mockReturnValue(['update-channel-members']);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { result } = renderHook(() => useChannelMemberActionItems({ channel, member }));
    const removeItem = result.current.find((item) => item.id === 'removeMember');
    removeItem?.action();

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(removeMembers).not.toHaveBeenCalled();

    // Invoke the destructive button's onPress to confirm removal.
    const buttons = alertSpy.mock.calls[0][2] as { onPress?: () => void; style?: string }[];
    const confirmButton = buttons.find((button) => button.style === 'destructive');
    confirmButton?.onPress?.();

    expect(removeMembers).toHaveBeenCalledWith(['target-user-id']);

    alertSpy.mockRestore();
  });

  it('keeps block standard when user is already blocked', () => {
    const blockedChannel = createChannelMock({ blockedUserIds: ['target-user-id'] });

    const { result } = renderHook(() =>
      useChannelMemberActionItems({ channel: blockedChannel, member }),
    );

    const blockItem = result.current.find((item) => item.id === 'block');
    expect(blockItem?.type).toBe('standard');
  });

  it('uses custom getChannelMemberActionItems with context and defaultItems when provided', () => {
    const customGetItems = jest.fn(({ defaultItems }: Parameters<GetChannelMemberActionItems>[0]) =>
      defaultItems.slice(0, 1),
    );

    const { result } = renderHook(() =>
      useChannelMemberActionItems({
        channel,
        getChannelMemberActionItems: customGetItems,
        member,
      }),
    );

    expect(customGetItems).toHaveBeenCalledWith({
      context: {
        channel,
        channelActions,
        isBlocked: false,
        isCurrentUser: false,
        member,
        ownCapabilities: [],
        t: expect.any(Function),
        userActions,
        userMuteActive: false,
      },
      defaultItems: expect.any(Array),
    });
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('muteUser');
  });
});

describe('buildDefaultChannelMemberActionItems', () => {
  const channel = createChannelMock();
  const member = createMemberMock();

  it('creates default mute and block items', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: false,
      isCurrentUser: false,
      member,
      ownCapabilities: undefined,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: false,
    });

    expect(items.map((item) => item.id)).toEqual(['muteUser', 'block']);
    expect(items.map((item) => item.action)).toEqual([actions.muteUser, actions.blockUser]);
    expect(items.map((item) => item.label)).toEqual(['Mute User', 'Block User']);
    expect(items.map((item) => item.type)).toEqual(['standard', 'destructive']);
  });

  it('returns no items when the member is the current user', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: false,
      isCurrentUser: true,
      member,
      ownCapabilities: undefined,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: false,
    });

    expect(items).toEqual([]);
  });

  it('appends a destructive removeMember item when own capabilities allow updating members', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: false,
      isCurrentUser: false,
      member,
      ownCapabilities: ['update-channel-members'],
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: false,
    });

    expect(items.map((item) => item.id)).toEqual(['muteUser', 'block', 'removeMember']);
    const removeItem = items.find((item) => item.id === 'removeMember');
    expect(removeItem?.label).toBe('Remove User');
    expect(removeItem?.type).toBe('destructive');
  });

  it('returns unmute/unblock variants when toggles are active', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: true,
      isCurrentUser: false,
      member,
      ownCapabilities: undefined,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: true,
    });

    expect(items.map((item) => item.action)).toEqual([actions.unmuteUser, actions.unblockUser]);
    expect(items.map((item) => item.label)).toEqual(['Unmute User', 'Unblock User']);
    expect(items.map((item) => item.type)).toEqual(['standard', 'standard']);
  });

  it('mute and block reflect their respective active states independently', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: false,
      isCurrentUser: false,
      member,
      ownCapabilities: undefined,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: true,
    });

    expect(items.find((item) => item.id === 'muteUser')?.action).toBe(actions.unmuteUser);
    expect(items.find((item) => item.id === 'block')?.action).toBe(actions.blockUser);
  });

  it('default getChannelMemberActionItems returns defaultItems unchanged', () => {
    const actions = createUserActions();
    const defaultItems = buildDefaultChannelMemberActionItems({
      channel,
      channelActions,
      isBlocked: false,
      isCurrentUser: false,
      member,
      ownCapabilities: undefined,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userActions: actions,
      userMuteActive: false,
    });

    const items = getChannelMemberActionItems({
      context: {
        channel,
        channelActions,
        isBlocked: false,
        isCurrentUser: false,
        member,
        ownCapabilities: undefined,
        t: ((value: string) => value) as TranslationContextValue['t'],
        userActions: actions,
        userMuteActive: false,
      },
      defaultItems,
    });

    expect(items).toBe(defaultItems);
  });
});
