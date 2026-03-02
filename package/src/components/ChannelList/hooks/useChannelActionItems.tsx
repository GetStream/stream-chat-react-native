import React, { useMemo } from 'react';
import { Alert, View } from 'react-native';

import type { Channel } from 'stream-chat';

import type { ChannelActions } from './useChannelActions';
import { useChannelActions } from './useChannelActions';
import { useChannelMembershipState } from './useChannelMembershipState';
import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext, useTheme, useTranslationContext } from '../../../contexts';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { Archive, IconProps } from '../../../icons';
import { ArrowBoxLeft } from '../../../icons/ArrowBoxLeft';

export type ChannelActionHandler = () => Promise<void> | void;

export type ChannelActionItem = {
  action: ChannelActionHandler;
  Icon: React.ReactElement;
  id: keyof ChannelActions | string;
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

const ChannelActionsIcon = ({ Icon }: { Icon: React.ComponentType<IconProps> }) => {
  const {
    theme: { semantics },
  } = useTheme();

  return <Icon stroke={semantics.textSecondary} width={20} height={20} />;
};

export const buildDefaultChannelActionItems: BuildDefaultChannelActionItems = (
  channelActionItemsParams,
) => {
  const {
    actions: { archive, deleteChannel, leave, unarchive },
    isArchived,
    isDirectChat,
    t,
    channel,
  } = channelActionItemsParams;
  const ownUserId = channel.getClient().userID;

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
    isArchived
      ? {
          action: unarchive,
          Icon: <ChannelActionsIcon Icon={Archive} />,
          id: 'unarchive',
          label: `Unarchive ${isDirectChat ? 'Chat' : 'Group'}`,
          placement: isDirectChat ? 'sheet' : 'both',
          type: 'standard',
        }
      : {
          action: archive,
          Icon: <ChannelActionsIcon Icon={Archive} />,
          id: 'archive',
          label: `Archive ${isDirectChat ? 'Chat' : 'Group'}`,
          placement: isDirectChat ? 'sheet' : 'both',
          type: 'standard',
        },
    {
      action: leave,
      Icon: <ChannelActionsIcon Icon={ArrowBoxLeft} />,
      id: 'leave',
      label: `Leave ${isDirectChat ? 'Chat' : 'Group'}`,
      placement: 'sheet',
      type: 'destructive',
    },
  ];

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
      Icon: <View />,
      id: 'deleteChannel',
      label: '',
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
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const ownUserId = client.userID;
  const membership = useChannelMembershipState(channel);
  const members = useChannelMembersState(channel);
  const channelActions = useChannelActions(channel);
  const otherMembers = useMemo(
    () => Object.values(members).filter((member) => member.user?.id !== ownUserId),
    [members, ownUserId],
  );
  const isDirectChat = otherMembers.length === 1;
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
