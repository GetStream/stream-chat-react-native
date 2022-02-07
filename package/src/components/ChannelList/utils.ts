import type { Channel, ExtendableGenerics, StreamChat } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MoveParameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  channels: Channel<StreamChatClient>[];
  cid: string;
};

export const moveChannelUp = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  cid,
  channels = [],
}: MoveParameters<StreamChatClient>) => {
  // get channel from channels
  const index = channels.findIndex((c) => c.cid === cid);
  if (index <= 0) return channels;
  const channel = channels[index];

  // remove channel from current position and add to start
  channels.splice(index, 1);
  channels.unshift(channel);

  return [...channels];
};

type GetParameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  client: StreamChat<StreamChatClient>;
  id: string;
  type: string;
};

export const getChannel = async <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  client,
  id,
  type,
}: GetParameters<StreamChatClient>) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
