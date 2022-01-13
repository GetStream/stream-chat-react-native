import type {
  Attachment as AttachmentType,
  Channel as ChannelType,
  CommandResponse as CommandType,
  Event as EventType,
  Message as MessageType,
  Reaction as ReactionType,
  User as UserType,
  StreamChatGenerics
} from 'stream-chat';

export type DefaultStreamChatGenerics = StreamChatGenerics & {
  attachmentType: AttachmentType;
  channelType: ChannelType;
  commandType: CommandType;
  eventType: EventType;
  messageType: MessageType;
  reactionType: ReactionType;
  userType: UserType;
}
