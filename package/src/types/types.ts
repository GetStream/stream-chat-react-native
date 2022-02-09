import type {
  Attachment,
  Channel,
  CommandResponse,
  Event,
  ExtendableGenerics,
  Message,
  Reaction,
  User,
} from 'stream-chat';

interface StreamChatGenerics extends ExtendableGenerics {}

export type DefaultStreamChatGenerics = StreamChatGenerics & {
  attachmentType: Attachment;
  channelType: Channel;
  commandType: CommandResponse;
  eventType: Event;
  messageType: Message;
  reactionType: Reaction;
  userType: User;
};

export type UnknownType = Record<string, unknown>;
