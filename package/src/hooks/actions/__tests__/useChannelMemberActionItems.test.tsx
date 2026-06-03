import React, { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';
import type { Channel, ChannelMemberResponse, Mute } from 'stream-chat';

import * as useMutedUsersModule from '../../../components/ChannelList/hooks/useMutedUsers';
import { ChatProvider } from '../../../contexts/chatContext/ChatContext';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import * as TranslationContext from '../../../contexts/translationContext/TranslationContext';
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
        actions: userActions,
        channel,
        isBlocked: false,
        isCurrentUser: false,
        member,
        t: expect.any(Function),
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
      actions,
      channel,
      isBlocked: false,
      isCurrentUser: false,
      member,
      t: ((value: string) => value) as TranslationContextValue['t'],
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
      actions,
      channel,
      isBlocked: false,
      isCurrentUser: true,
      member,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    expect(items).toEqual([]);
  });

  it('returns unmute/unblock variants when toggles are active', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      actions,
      channel,
      isBlocked: true,
      isCurrentUser: false,
      member,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: true,
    });

    expect(items.map((item) => item.action)).toEqual([actions.unmuteUser, actions.unblockUser]);
    expect(items.map((item) => item.label)).toEqual(['Unmute User', 'Unblock User']);
    expect(items.map((item) => item.type)).toEqual(['standard', 'standard']);
  });

  it('mute and block reflect their respective active states independently', () => {
    const actions = createUserActions();
    const items = buildDefaultChannelMemberActionItems({
      actions,
      channel,
      isBlocked: false,
      isCurrentUser: false,
      member,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: true,
    });

    expect(items.find((item) => item.id === 'muteUser')?.action).toBe(actions.unmuteUser);
    expect(items.find((item) => item.id === 'block')?.action).toBe(actions.blockUser);
  });

  it('default getChannelMemberActionItems returns defaultItems unchanged', () => {
    const actions = createUserActions();
    const defaultItems = buildDefaultChannelMemberActionItems({
      actions,
      channel,
      isBlocked: false,
      isCurrentUser: false,
      member,
      t: ((value: string) => value) as TranslationContextValue['t'],
      userMuteActive: false,
    });

    const items = getChannelMemberActionItems({
      context: {
        actions,
        channel,
        isBlocked: false,
        isCurrentUser: false,
        member,
        t: ((value: string) => value) as TranslationContextValue['t'],
        userMuteActive: false,
      },
      defaultItems,
    });

    expect(items).toBe(defaultItems);
  });
});
