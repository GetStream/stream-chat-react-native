import type { ExtendableGenerics, LiteralStringForUnion } from 'stream-chat';

export type Asset = {
  duration: number | null;
  filename: string;
  fileSize: string;
  height: number;
  playableDuration: number | null;
  source: 'camera' | 'picker';
  type: string;
  uri: string;
  width: number;
  id?: string;
  size?: number | string;
};

export type File = {
  name: string;
  duration?: string | null;
  id?: string;
  size?: number | string;
  type?: string;
  uri?: string;
};

export type DefaultAttachmentType = UnknownType & {
  file_size?: number | string;
  mime_type?: string;
  originalFile?: File;
};

interface DefaultUserType extends UnknownType {
  image?: string;
}

interface DefaultChannelType extends UnknownType {
  [key: string]: unknown;
  image?: string;
}

export interface DefaultStreamChatGenerics extends ExtendableGenerics {
  attachmentType: DefaultAttachmentType;
  channelType: DefaultChannelType;
  commandType: LiteralStringForUnion;
  eventType: UnknownType;
  messageType: UnknownType;
  reactionType: UnknownType;
  userType: DefaultUserType;
}

export type UnknownType = Record<string, unknown>;

export type ValueOf<T> = T[keyof T];
