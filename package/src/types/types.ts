import type { ExtendableGenerics, LiteralStringForUnion } from 'stream-chat';

interface DefaultUserType extends UnknownType {
  image?: string;
}

interface DefaultChannelType extends UnknownType {
  [key: string]: unknown;
  image?: string;
}

export interface DefaultStreamChatGenerics extends ExtendableGenerics {
  attachmentType: UnknownType;
  channelType: DefaultChannelType;
  commandType: LiteralStringForUnion;
  eventType: UnknownType;
  messageType: UnknownType;
  reactionType: UnknownType;
  userType: DefaultUserType;
}

export type UnknownType = Record<string, unknown>;
