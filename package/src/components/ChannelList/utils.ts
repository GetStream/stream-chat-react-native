import type { Channel, ChannelSort, StreamChat } from 'stream-chat';

import { findLastPinnedChannelIndex, shouldConsiderPinnedChannels } from './hooks/utils';

type MoveParameters = {
  channels: Array<Channel>;
  channelToMove: Channel;
  /**
   * If the index of the channel within `channels` list which is being moved upwards
   * (`channelToMove`) is known, you can supply it to skip extra calculation.
   */
  channelToMoveIndexWithinChannels?: number;
  sort?: ChannelSort;
};

export const moveChannelUp = ({
  channels,
  channelToMove,
  channelToMoveIndexWithinChannels,
  sort,
}: MoveParameters) => {
  // get index of channel to move up
  const targetChannelIndex =
    channelToMoveIndexWithinChannels ??
    channels.findIndex((channel) => channel.cid === channelToMove.cid);

  const targetChannelExistsWithinList = targetChannelIndex >= 0;
  const targetChannelAlreadyAtTheTop = targetChannelIndex === 0;

  // pinned channels should not move within the list based on recent activity, channels which
  // receive messages and are not pinned should move upwards but only under the last pinned channel
  // in the list
  const considerPinnedChannels = shouldConsiderPinnedChannels(sort);

  if (targetChannelAlreadyAtTheTop) {
    return channels;
  }

  const newChannels = [...channels];

  // target channel index is known, remove it from the list
  if (targetChannelExistsWithinList) {
    newChannels.splice(targetChannelIndex, 1);
  }

  // as position of pinned channels has to stay unchanged, we need to
  // find last pinned channel in the list to move the target channel after
  let lastPinnedChannelIndex: number | null = null;
  if (considerPinnedChannels) {
    lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
  }

  // re-insert it at the new place (to specific index if pinned channels are considered)
  newChannels.splice(
    typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0,
    0,
    channelToMove,
  );

  return newChannels;
};

type GetParameters = {
  client: StreamChat;
  id: string;
  type: string;
};

export const getChannel = async ({ client, id, type }: GetParameters) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
