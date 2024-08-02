import type { ExtendableGenerics, LiteralStringForUnion } from 'stream-chat';

import type { FileStateValue } from '../utils/utils';

export enum FileTypes {
  Audio = 'audio',
  File = 'file',
  Giphy = 'giphy',
  Image = 'image',
  Imgur = 'imgur',
  Video = 'video',
  VoiceRecording = 'voiceRecording',
}

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
  type?: FileTypes;
  // The uri should be of type `string`. But is `string|undefined` because the same type is used for the response from Stream's Attachment. This shall be fixed.
  uri?: string;
  waveform_data?: number[];
};

export type FileUpload = {
  file: File;
  id: string;
  state: FileStateValue;
  duration?: number;
  paused?: boolean;
  progress?: number;
  thumb_url?: string;
  type?: string;
  url?: string;
  waveform_data?: number[];
};

export type ImageUpload = {
  file: Partial<Asset>;
  id: string;
  state: FileStateValue;
  height?: number;
  url?: string;
  width?: number;
};

export type DefaultAttachmentType = UnknownType & {
  duration?: number;
  file_size?: number;
  mime_type?: string;
  originalFile?: File;
  originalImage?: Partial<Asset>;
  waveform_data?: number[];
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
