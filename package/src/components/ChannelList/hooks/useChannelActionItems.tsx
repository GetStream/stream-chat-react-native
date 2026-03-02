import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { Channel } from 'stream-chat';

import type { ChannelActions } from './useChannelActions';
import { useChannelActions } from './useChannelActions';

export type ChannelActionItem = {
  action: ChannelActions[keyof ChannelActions];
  Icon: React.ReactElement;
  label: string;
  type: 'destructive' | 'standard';
};

export type GetChannelActionItems = (channelActions: ChannelActions) => ChannelActionItem[];

export const getChannelActionItems: GetChannelActionItems = ({
  archiveUnarchive,
  deleteChannel,
  leave,
  pinUnpin,
}) => [
  {
    action: pinUnpin,
    Icon: <View />,
    label: '',
    type: 'standard',
  },
  {
    action: archiveUnarchive,
    Icon: <View />,
    label: '',
    type: 'standard',
  },
  {
    action: leave,
    Icon: <View />,
    label: '',
    type: 'destructive',
  },
  {
    action: deleteChannel,
    Icon: <View />,
    label: '',
    type: 'destructive',
  },
];

type UseChannelActionItemsParams = {
  channel: Channel;
  getChannelActionItems?: GetChannelActionItems;
};

export const useChannelActionItems = ({
  channel,
  getChannelActionItems: getChannelActionItemsProp = getChannelActionItems,
}: UseChannelActionItemsParams) => {
  const channelActions = useChannelActions(channel);

  return useMemo(
    () => getChannelActionItemsProp(channelActions),
    [channelActions, getChannelActionItemsProp],
  );
};
