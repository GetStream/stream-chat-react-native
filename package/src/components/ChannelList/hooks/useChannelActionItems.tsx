import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { Channel } from 'stream-chat';

import type { ChannelActions } from './useChannelActions';
import { useChannelActions } from './useChannelActions';

export type ChannelActionHandler = () => Promise<void> | void;

export type ChannelActionItem = {
  action: ChannelActionHandler;
  Icon: React.ReactElement;
  id: keyof ChannelActions;
  label: string;
  type: 'destructive' | 'standard';
};

export type ChannelActionItemsParams = ChannelActions & {
  channel: Channel;
};

export type GetChannelActionItems = (
  channelActionItemsParams: ChannelActionItemsParams,
) => ChannelActionItem[];

export const getChannelActionItems: GetChannelActionItems = (channelActionItemsParams) => {
  const { archive, deleteChannel, leave, pin, unarchive, unpin } = channelActionItemsParams;

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
      action: deleteChannel,
      Icon: <View />,
      id: 'deleteChannel',
      label: '',
      type: 'destructive',
    },
  ];
};

type UseChannelActionItemsParams = {
  channel: Channel;
  getChannelActionItems?: GetChannelActionItems;
};

export const useChannelActionItems = ({
  channel,
  getChannelActionItems: getChannelActionItemsProp = getChannelActionItems,
}: UseChannelActionItemsParams) => {
  const channelActions = useChannelActions(channel);
  const channelActionItemsParams = useMemo(
    () => ({
      channel,
      ...channelActions,
    }),
    [channel, channelActions],
  );

  return useMemo(
    () => getChannelActionItemsProp(channelActionItemsParams),
    [channelActionItemsParams, getChannelActionItemsProp],
  );
};
