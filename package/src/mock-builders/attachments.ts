import type { Attachment } from 'stream-chat';

import { generateRandomId } from '../utils/utils';

type FileReference = {
  name: string;
  size: number;
  type: string;
  uri: string;
};

type LocalAttachmentData = {
  localMetadata: { id: string };
};

export const generateLocalAttachmentData = (): LocalAttachmentData => ({
  localMetadata: {
    id: generateRandomId(),
  },
});

export const generateLocalFileUploadAttachmentData = (
  overrides?: Partial<LocalAttachmentData & { file: Partial<FileReference> }>,
  attachmentData?: Partial<Attachment>,
) => ({
  localMetadata: {
    ...generateLocalAttachmentData().localMetadata,
    ...overrides,
    file: generateFileReference(overrides?.file ?? {}),
  },
  type: 'file' as const,
  ...attachmentData,
});

export const generateImageAttachment = (a?: Partial<Attachment>): Attachment => ({
  fallback: generateRandomId() + '.png',
  image_url: 'https://' + generateRandomId() + '.png',
  type: 'image',
  ...a,
});

export const generateAudioAttachment = (a?: Partial<Attachment>): Attachment => ({
  asset_url: 'https://' + generateRandomId() + '.mp3',
  fallback: generateRandomId() + '.mp3',
  type: 'audio',
  ...a,
});

export const generateFileAttachment = (a?: Partial<Attachment>): Attachment => ({
  asset_url: 'https://' + generateRandomId() + '.xls',
  fallback: generateRandomId() + '.xls',
  type: 'file',
  ...a,
});

export const generateVideoAttachment = (a?: Partial<Attachment>): Attachment => ({
  fallback: generateRandomId() + '.mp4',
  image_url: 'https://' + generateRandomId() + '.mp4',
  type: 'video',
  ...a,
});

const fileName = generateRandomId() + '.png';

export const generateFileReference = (a?: Partial<FileReference>): FileReference => ({
  name: fileName,
  size: 1000,
  type: 'image/png',
  uri: 'file://' + generateRandomId() + '.png',
  ...a,
});
