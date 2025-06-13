import { generateRandomId } from '../utils/utils';

export const generateLocalAttachmentData = () => ({
  localMetadata: {
    id: generateRandomId(),
  },
});

export const generateLocalFileUploadAttachmentData = (overrides, attachmentData) => ({
  localMetadata: {
    ...generateLocalAttachmentData().localMetadata,
    ...overrides,
    file: generateFileReference(overrides?.file ?? {}),
  },
  type: 'file',
  ...attachmentData,
});

export const generateImageAttachment = (a) => ({
  fallback: generateRandomId() + '.png',
  image_url: 'https://' + generateRandomId() + '.png',
  type: 'image',
  ...a,
});

export const generateAudioAttachment = (a) => ({
  asset_url: 'https://' + generateRandomId() + '.mp3',
  fallback: generateRandomId() + '.mp3',
  type: 'audio',
  ...a,
});

export const generateFileAttachment = (a) => ({
  asset_url: 'https://' + generateRandomId() + '.xls',
  fallback: generateRandomId() + '.xls',
  type: 'file',
  ...a,
});

export const generateVideoAttachment = (a) => ({
  fallback: generateRandomId() + '.mp4',
  image_url: 'https://' + generateRandomId() + '.mp4',
  type: 'video',
  ...a,
});

const fileName = generateRandomId() + '.png';

export const generateFileReference = (a) => ({
  name: fileName,
  size: 1000,
  type: 'image/png',
  uri: 'file://' + generateRandomId() + '.png',
  ...a,
});
