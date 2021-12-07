import type { LiteralStringForUnion } from 'stream-chat';

export type Asset = {
  filename: string;
  fileSize: string;
  height: number;
  playableDuration: number | null;
  source: 'camera' | 'picker';
  uri: string;
  width: number;
  id?: string;
};

export type File = {
  name: string;
  duration?: number | null;
  size?: number | string;
  type?: string;
  uri?: string;
};

export type DefaultAttachmentType = UnknownType & {
  file_size?: number | string;
  mime_type?: string;
};

export type DefaultChannelType = UnknownType & {
  image?: string;
};

export type DefaultCommandType = LiteralStringForUnion;

export type DefaultEventType = UnknownType;

export type DefaultMessageType = UnknownType;

export type DefaultReactionType = UnknownType;

export type DefaultUserType = UnknownType & {
  image?: string;
};

export type UnknownType = Record<string, unknown>;
