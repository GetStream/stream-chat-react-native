import React, { useMemo } from 'react';
import { Alert, View } from 'react-native';

import type { Channel, ChannelMemberResponse } from 'stream-chat';

import type { ChannelActions } from './useChannelActions';
import { useChannelActions } from './useChannelActions';
import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext, useTranslationContext } from '../../../contexts';
import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';

export type ChannelActionHandler = () => Promise<void> | void;

export type ChannelActionItem = {
  action: ChannelActionHandler;
  Icon: React.ReactElement;
  id: keyof ChannelActions | string;
  label: string;
  type: 'destructive' | 'standard';
};

export type ChannelActionItemsParams = {
  actions: ChannelActions;
  channel: Channel;
  isDirectChat: boolean;
  members: Record<string, ChannelMemberResponse>;
  otherMembers: ChannelMemberResponse[];
  ownUserId?: string;
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
    isDirectChat,
    t,
  } = channelActionItemsParams;

  return [
    {
      action: pin,
      Icon: <View />,
      id: 'pin',
      label: '',
      type: 'standard',
    },
    {
      action: unpin,
      Icon: <View />,
      id: 'unpin',
      label: '',
      type: 'standard',
    },
    {
      action: archive,
      Icon: <View />,
      id: 'archive',
      label: '',
      type: 'standard',
    },
    {
      action: unarchive,
      Icon: <View />,
      id: 'unarchive',
      label: '',
      type: 'standard',
    },
    {
      action: leave,
      Icon: <View />,
      id: 'leave',
      label: '',
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
  const members = useChannelMembersState(channel);
  const channelActions = useChannelActions(channel);
  const otherMembers = useMemo(
    () =>
      Object.values<ChannelMemberResponse>(members).filter(
        (member) => member.user?.id !== ownUserId,
      ),
    [members, ownUserId],
  );
  const isDirectChat = otherMembers.length === 1;
  const channelActionItemsParams = useMemo(
    () => ({
      actions: channelActions,
      channel,
      isDirectChat,
      members,
      otherMembers,
      ownUserId,
      t,
    }),
    [channel, channelActions, isDirectChat, members, otherMembers, ownUserId, t],
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
