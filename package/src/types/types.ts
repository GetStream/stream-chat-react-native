import type { ExtendableGenerics, LiteralStringForUnion } from 'stream-chat';

export type Asset = {
  duration: number;
  height: number;
  name: string;
  source: 'camera' | 'picker';
  type: string;
  uri: string;
  width: number;
  id?: string;
  size?: number;
};

export type File = {
  name: string;
  duration?: number;
  id?: string;
  mimeType?: string;
  size?: number;
  // The uri should be of type `string`. But is `string|undefined` because the same type is used for the response from Stream's Attachment. This shall be fixed.
  uri?: string;
};

export type DefaultAttachmentType = UnknownType & {
  file_size?: number;
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
