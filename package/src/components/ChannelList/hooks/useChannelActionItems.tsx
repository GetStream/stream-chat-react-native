import React, { useMemo } from 'react';
import { Alert } from 'react-native';

import type { Channel } from 'stream-chat';

import { ChannelActions, getOtherUserInDirectChannel } from './useChannelActions';
import { useChannelActions } from './useChannelActions';
import { useChannelMembershipState } from './useChannelMembershipState';

import { useChannelMuteActive } from './useChannelMuteActive';
import { useIsDirectChat } from './useIsDirectChat';

import { useTheme, useTranslationContext } from '../../../contexts';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { Archive, IconProps, Mute, BlockUser, Delete } from '../../../icons';
import { ArrowBoxLeft } from '../../../icons/ArrowBoxLeft';

export type ChannelActionHandler = () => Promise<void> | void;

export type ChannelActionItem = {
  action: ChannelActionHandler;
  Icon: React.ComponentType<IconProps>;
  id: 'mute' | 'block' | 'archive' | 'leave' | 'deleteChannel' | string;
  label: string;
  placement: 'both' | 'sheet' | 'swipe';
  type: 'destructive' | 'standard';
};

export type ChannelActionItemsParams = {
  actions: ChannelActions;
  channel: Channel;
  isArchived: boolean;
  isDirectChat: boolean;
  isPinned: boolean;
  muteActive: boolean;
  t: TranslationContextValue['t'];
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
    actions: {
      archive,
      deleteChannel,
      leave,
      unarchive,
      muteChannel,
      unmuteChannel,
      muteUser,
      unmuteUser,
      blockUser,
      unblockUser,
    },
    isArchived,
    isDirectChat,
    muteActive,
    t,
    channel,
  } = channelActionItemsParams;
  const ownUserId = channel.getClient().userID;

  const client = channel.getClient();

  const isBlocked = isDirectChat
    ? new Set(client.blockedUsers.getLatestValue().userIds).has(
        getOtherUserInDirectChannel(channel)?.user?.id ?? '',
      )
    : undefined;

  const actionItems: ChannelActionItem[] = [
    {
      action: isDirectChat
        ? muteActive
          ? unmuteUser
          : muteUser
        : muteActive
          ? unmuteChannel
          : muteChannel,
      Icon: (props) => (
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
        ? muteActive
          ? t('Unmute User')
          : t('Mute User')
        : muteActive
          ? t('Unmute Group')
          : t('Mute Group'),
      placement: isDirectChat ? 'sheet' : 'both',
      type: 'standard',
    },
  ];

  if (isDirectChat) {
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
    action: isArchived ? unarchive : archive,
    Icon: (props) => <ChannelActionsIcon Icon={Archive} {...props} />,
    id: 'archive',
    label: isDirectChat
      ? isArchived
        ? t('Unarchive Chat')
        : t('Archive Chat')
      : isArchived
        ? t('Unarchive Group')
        : t('Archive Group'),
    placement: isDirectChat ? 'sheet' : 'both',
    type: 'standard',
  });

  actionItems.push({
    action: leave,
    Icon: (props) => <ChannelActionsIcon Icon={ArrowBoxLeft} {...props} />,
    id: 'leave',
    label: isDirectChat ? t('Leave Chat') : t('Leave Group'),
    placement: 'sheet',
    type: 'destructive',
  });

  if (channel.data?.created_by?.id === ownUserId) {
    actionItems.push({
      action: () => {
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
              await deleteChannel();
            },
            style: 'destructive',
            text: t('Delete'),
          },
        ]);
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

  const muteActive = useChannelMuteActive(channel);

  const channelActionItemsParams = useMemo(
    () => ({
      actions: channelActions,
      channel,
      isArchived,
      isDirectChat,
      isPinned,
      muteActive,
      t,
    }),
    [channel, muteActive, channelActions, isArchived, isDirectChat, isPinned, t],
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
