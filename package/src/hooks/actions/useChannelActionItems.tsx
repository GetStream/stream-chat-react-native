import React, { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import type { BlockedUsersState, Channel } from 'stream-chat';

import type { ActionItem } from './types';
import {
  ChannelActionHandler,
  ChannelActions,
  getOtherUserInDirectChannel,
  useChannelActions,
} from './useChannelActions';

import { useMutedUsers } from '../../components/ChannelList/hooks/useMutedUsers';
import { useIsChannelMuted } from '../../components/ChannelPreview/hooks/useIsChannelMuted';
import { useTheme, useTranslationContext } from '../../contexts';
import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import type { TranslationContextValue } from '../../contexts/translationContext/TranslationContext';
import { IconProps, Mute, BlockUser, Delete, Sound } from '../../icons';
import { ArrowBoxLeft } from '../../icons/leave';
import { useChannelMembershipState } from '../useChannelMembershipState';
import { useIsDirectChat } from '../useIsDirectChat';
import { useStateStore } from '../useStateStore';

export type ChannelActionItem = ActionItem<
  'mute' | 'muteUser' | 'block' | 'leave' | 'deleteChannel' | string
> & {
  placement: 'both' | 'sheet' | 'swipe';
};

export type ChannelActionItemsParams = {
  a11yLabel: (key: string) => string | undefined;
  actions: ChannelActions;
  channel: Channel;
  channelMuteActive: boolean;
  isArchived: boolean;
  isBlocked: boolean | undefined;
  isDirectChat: boolean;
  isPinned: boolean;
  t: TranslationContextValue['t'];
  userMuteActive: boolean;
};

export type BuildDefaultChannelActionItems = (
  channelActionItemsParams: ChannelActionItemsParams,
) => ChannelActionItem[];

const ChannelActionsIcon = ({
  Icon,
  ...rest
}: { Icon: React.ComponentType<IconProps> } & IconProps) => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Icon stroke={semantics.textSecondary} width={20} height={20} {...rest} />;
};

export const buildDefaultChannelActionItems: BuildDefaultChannelActionItems = (
  channelActionItemsParams,
) => {
  const {
    a11yLabel,
    actions: {
      deleteChannel,
      leave,
      muteChannel,
      unmuteChannel,
      muteUser,
      unmuteUser,
      blockUser,
      unblockUser,
    },
    channelMuteActive,
    isBlocked,
    isDirectChat,
    userMuteActive,
    t,
    channel,
  } = channelActionItemsParams;
  const ownUserId = channel.getClient().userID;

  const actionItems: ChannelActionItem[] = [
    {
      action: channelMuteActive ? unmuteChannel : muteChannel,
      Icon: (props) =>
        channelMuteActive ? (
          <Sound width={20} height={20} {...props} />
        ) : (
          <Mute
            width={20}
            height={20}
            {...props}
            stroke={undefined}
            fill={props.fill ?? props.stroke}
          />
        ),
      id: 'mute',
      label: isDirectChat
        ? channelMuteActive
          ? t('Unmute Chat')
          : t('Mute Chat')
        : channelMuteActive
          ? t('Unmute Group')
          : t('Mute Group'),
      placement: 'swipe',
      type: 'standard',
    },
  ];

  if (isDirectChat) {
    actionItems.push({
      action: userMuteActive ? unmuteUser : muteUser,
      Icon: (props) =>
        userMuteActive ? (
          <ChannelActionsIcon Icon={Sound} {...props} />
        ) : (
          <ChannelActionsIcon
            Icon={Mute}
            {...props}
            fill={props.fill ?? props.stroke}
            stroke={undefined}
          />
        ),
      id: 'muteUser',
      label: userMuteActive ? t('Unmute User') : t('Mute User'),
      placement: 'sheet',
      type: 'standard',
    });

    actionItems.push({
      action: isBlocked ? unblockUser : blockUser,
      Icon: (props) => <ChannelActionsIcon Icon={BlockUser} {...props} />,
      id: 'block',
      label: isBlocked ? t('Unblock User') : t('Block User'),
      placement: 'sheet',
      type: 'standard',
    });
  }

  actionItems.push({
    accessibilityHint: a11yLabel(
      isDirectChat ? 'a11y/Removes you from this chat' : 'a11y/Removes you from this group',
    ),
    action: leave,
    Icon: (props) => <ChannelActionsIcon Icon={ArrowBoxLeft} {...props} />,
    id: 'leave',
    label: isDirectChat ? t('Leave Chat') : t('Leave Group'),
    placement: 'sheet',
    type: 'destructive',
  });

  if (channel.data?.created_by?.id === ownUserId) {
    actionItems.push({
      accessibilityHint: a11yLabel(
        isDirectChat ? 'a11y/Deletes this chat permanently' : 'a11y/Deletes this group permanently',
      ),
      action: (...args: Parameters<ChannelActionHandler>) => {
        const title = isDirectChat ? t('Delete chat') : t('Delete group');
        const message = isDirectChat
          ? t("Are you sure you want to delete this chat? This can't be undone.")
          : t("Are you sure you want to delete this group? This can't be undone.");

        Alert.alert(title, message, [
          {
            style: 'cancel',
            text: t('Cancel'),
          },
          {
            onPress: async () => {
              await deleteChannel(...args);
            },
            style: 'destructive',
            text: t('Delete'),
          },
        ]);

        return Promise.resolve();
      },
      Icon: (props) => <ChannelActionsIcon Icon={Delete} {...props} />,
      id: 'deleteChannel',
      label: isDirectChat ? t('Delete Chat') : t('Delete Group'),
      placement: 'sheet',
      type: 'destructive',
    });
  }

  return actionItems;
};

export type GetChannelActionItems = (params: {
  context: ChannelActionItemsParams;
  defaultItems: ChannelActionItem[];
}) => ChannelActionItem[];

export const getChannelActionItems: GetChannelActionItems = ({ defaultItems }) => defaultItems;

type UseChannelActionItemsParams = {
  channel: Channel;
  getChannelActionItems?: GetChannelActionItems;
};

const blockedUsersStateSelector = (state: BlockedUsersState) =>
  ({ userIds: state.userIds }) as const;

export const useChannelActionItems = ({
  channel,
  getChannelActionItems: getChannelActionItemsProp = getChannelActionItems,
}: UseChannelActionItemsParams) => {
  const { t } = useTranslationContext();
  const membership = useChannelMembershipState(channel);
  const channelActions = useChannelActions(channel);
  const isDirectChat = useIsDirectChat(channel);
  const isPinned = Boolean(membership?.pinned_at);
  const isArchived = Boolean(membership?.archived_at);

  const { muted: channelMuteActive } = useIsChannelMuted(channel);
  const mutedUsers = useMutedUsers(channel);
  const userMuteActive = isDirectChat
    ? mutedUsers.some(
        (mutedUser) => getOtherUserInDirectChannel(channel)?.user?.id === mutedUser.target.id,
      )
    : false;

  const { enabled: a11yEnabled } = useAccessibilityContext();
  const a11yLabel = useCallback(
    (key: string): string | undefined => (a11yEnabled ? t(key) : undefined),
    [a11yEnabled, t],
  );

  const { userIds: blockedUserIds } = useStateStore(
    channel.getClient().blockedUsers,
    blockedUsersStateSelector,
  );

  const isBlocked = isDirectChat
    ? blockedUserIds.includes(getOtherUserInDirectChannel(channel)?.user?.id ?? '')
    : undefined;

  const channelActionItemsParams = useMemo(
    () => ({
      a11yLabel,
      actions: channelActions,
      channel,
      channelMuteActive,
      isArchived,
      isBlocked,
      isDirectChat,
      isPinned,
      t,
      userMuteActive,
    }),
    [
      a11yLabel,
      channel,
      channelActions,
      channelMuteActive,
      isArchived,
      isBlocked,
      isDirectChat,
      isPinned,
      t,
      userMuteActive,
    ],
  );

  const defaultItems = useMemo(
    () => buildDefaultChannelActionItems(channelActionItemsParams),
    [channelActionItemsParams],
  );

  return useMemo(
    () =>
      getChannelActionItemsProp({
        context: channelActionItemsParams,
        defaultItems,
      }),
    [channelActionItemsParams, defaultItems, getChannelActionItemsProp],
  );
};
