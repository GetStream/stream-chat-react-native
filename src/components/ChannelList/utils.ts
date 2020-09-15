import type {
  Channel,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

type MoveParameters<
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
> = {
  channels: Channel<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >[];
  cid: string;
};

export const moveChannelUp = <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  cid,
  channels = [],
}: MoveParameters<
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType
>) => {
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
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
> = {
  client: StreamChat<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >;
  id: string;
  type: string;
};

export const getChannel = async <
  AttachmentType extends UnknownType = UnknownType,
  ChannelType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion,
  EventType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType
>({
  client,
  id,
  type,
}: GetParameters<
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType
>) => {
  const channel = client.channel(type, id);
  await channel.watch();
  return channel;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;
