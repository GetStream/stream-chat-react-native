import type {
  Channel,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

type MoveParameters<
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
> = {
  channels: Channel<At, Ch, Co, Ev, Me, Re, Us>[];
  cid: string;
};

export const moveChannelUp = <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  cid,
  channels = [],
}: MoveParameters<At, Ch, Co, Ev, Me, Re, Us>) => {
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
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
> = {
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  id: string;
  type: string;
};

export const getChannel = async <
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>({
  client,
  id,
  type,
}: GetParameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
