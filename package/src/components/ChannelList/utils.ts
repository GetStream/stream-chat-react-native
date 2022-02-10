import type { Channel, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MoveParameters<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  channels: Channel<StreamChatGenerics>[];
  cid: string;
};

export const moveChannelUp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  channels = [],
}: MoveParameters<StreamChatGenerics>) => {
  // get channel from channels
  const index = channels.findIndex((c) => c.cid === cid);
  if (index <= 0) return channels;
  const channel = channels[index];

  // remove channel from current position and add to start
  channels.splice(index, 1);
  channels.unshift(channel);

  return [...channels];
};

type GetParameters<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  client: StreamChat<StreamChatGenerics>;
  id: string;
  type: string;
};

export const getChannel = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  id,
  type,
}: GetParameters<StreamChatGenerics>) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
