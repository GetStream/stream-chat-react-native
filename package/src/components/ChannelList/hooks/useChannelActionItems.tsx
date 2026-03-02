import React, { useMemo } from 'react';
import { Alert, View } from 'react-native';

import type { Channel } from 'stream-chat';

import type { ChannelActions } from './useChannelActions';
import { useChannelActions } from './useChannelActions';
import { useChannelMembershipState } from './useChannelMembershipState';
import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext, useTranslationContext } from '../../../contexts';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';

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

export const buildDefaultChannelActionItems: BuildDefaultChannelActionItems = (
  channelActionItemsParams,
) => {
  const {
    actions: { archive, deleteChannel, leave, pin, unarchive, unpin },
    isArchived,
    isDirectChat,
    isPinned,
    t,
  } = channelActionItemsParams;

  return [
    isPinned
      ? {
          action: unpin,
          Icon: <View />,
          id: 'unpin',
          label: '',
          placement: 'both',
          type: 'standard',
        }
      : {
          action: pin,
          Icon: <View />,
          id: 'pin',
          label: '',
          placement: 'both',
          type: 'standard',
        },
    isArchived
      ? {
          action: unarchive,
          Icon: <View />,
          id: 'unarchive',
          label: '',
          placement: 'both',
          type: 'standard',
        }
      : {
          action: archive,
          Icon: <View />,
          id: 'archive',
          label: '',
          placement: 'both',
          type: 'standard',
        },
    {
      action: leave,
      Icon: <View />,
      id: 'leave',
      label: '',
      placement: 'both',
      type: 'destructive',
    },
    {
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
      placement: 'both',
      type: 'destructive',
    },
  ];
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
