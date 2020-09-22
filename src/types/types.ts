import type { LiteralStringForUnion, UnknownType } from 'stream-chat';

export type DefaultAttachmentType = {
  file_size?: string;
  mime_type?: string;
};

export type DefaultChannelType = {
  image?: string;
};

export type DefaultCommandType = LiteralStringForUnion;

export type DefaultEventType = UnknownType;

export type DefaultMessageType = UnknownType;

export type DefaultReactionType = UnknownType;

export type DefaultUserType = {
  image?: string;
};
