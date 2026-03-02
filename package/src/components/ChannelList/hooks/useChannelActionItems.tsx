import React, { useMemo } from 'react';
import { Alert } from 'react-native';

import type { Channel } from 'stream-chat';

import { ChannelActions, getOtherUserInDirectChannel } from './useChannelActions';
import { useChannelActions } from './useChannelActions';
import { useChannelMembershipState } from './useChannelMembershipState';

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
    t,
    channel,
  } = channelActionItemsParams;
  const ownUserId = channel.getClient().userID;

  const client = channel.getClient();

  const muteActive = isDirectChat
    ? !!client.mutedUsers.find(
        (mutedUser) => getOtherUserInDirectChannel(channel)?.user?.id === mutedUser.target.id,
      )
    : client.mutedChannels.find((mutedChannel) => channel.cid === mutedChannel.channel?.cid);

  const isBlocked = isDirectChat
    ? new Set(client.blockedUsers.getLatestValue().userIds).has(
        getOtherUserInDirectChannel(channel)?.user?.id ?? '',
      )
    : undefined;

  const actionItems: ChannelActionItem[] = [
    // isPinned
    //   ? {
    //       action: unpin,
    //       Icon: <View />,
    //       id: 'unpin',
    //       label: '',
    //       placement: 'both',
    //       type: 'standard',
    //     }
    //   : {
    //       action: pin,
    //       Icon: <View />,
    //       id: 'pin',
    //       label: '',
    //       placement: 'both',
    //       type: 'standard',
    //     },
    {
      action: isDirectChat
        ? muteActive
          ? unmuteUser
          : muteUser
        : muteActive
          ? unmuteChannel
          : muteChannel,
      Icon: (props) => <ChannelActionsIcon Icon={Mute} {...props} />,
      id: 'mute',
      label: `${muteActive ? 'Unmute' : 'Mute'} ${isDirectChat ? 'User' : 'Group'}`,
      placement: isDirectChat ? 'sheet' : 'both',
      type: 'standard',
    },
  ];

  if (isDirectChat) {
    actionItems.push({
      action: isBlocked ? unblockUser : blockUser,
      Icon: (props) => <ChannelActionsIcon Icon={BlockUser} {...props} />,
      id: 'block',
      label: `${isBlocked ? 'Unblock' : 'Block'} User`,
      placement: 'sheet',
      type: 'standard',
    });
  }

  actionItems.push({
    action: isArchived ? unarchive : archive,
    Icon: (props) => <ChannelActionsIcon Icon={Archive} {...props} />,
    id: 'archive',
    label: `${isArchived ? 'Unarchive' : 'Archive'} ${isDirectChat ? 'Chat' : 'Group'}`,
    placement: isDirectChat ? 'sheet' : 'both',
    type: 'standard',
  });

  actionItems.push({
    action: leave,
    Icon: (props) => <ChannelActionsIcon Icon={ArrowBoxLeft} {...props} />,
    id: 'leave',
    label: `Leave ${isDirectChat ? 'Chat' : 'Group'}`,
    placement: 'sheet',
    type: 'destructive',
  });

  if (channel.data?.created_by_id === ownUserId) {
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
      label: `Delete ${isDirectChat ? 'Chat' : 'Group'}`,
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
  const channelActionItemsParams = useMemo(
    () => ({
      actions: channelActions,
      channel,
      isArchived,
      isDirectChat,
      isPinned,
      t,
    }),
    [channel, channelActions, isArchived, isDirectChat, isPinned, t],
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
