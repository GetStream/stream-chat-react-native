import type { Action, Attachment } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

const image_url = 'http://www.jackblack.com/tenac_iousd.bmp';

export const generateAttachmentAction = (a?: Partial<Action>): Action => ({
  name: uuidv4(),
  text: uuidv4(),
  value: uuidv4(),
  ...a,
});

export const generateVideoAttachment = (a?: Partial<Attachment>): Attachment => ({
  asset_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  mime_type: 'video/mp4',
  thumb_url:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  title: uuidv4(),
  type: 'video',
  ...a,
});

export const generateImageAttachment = (a?: Partial<Attachment>): Attachment => ({
  image_url: uuidv4(),
  title: uuidv4(),
  type: 'image',
  ...a,
});

type UploadPreview = {
  file: { uri?: string; name?: string; type?: string };
  id: string;
  state: string;
};

export const generateImageUploadPreview = (a?: Partial<UploadPreview>): UploadPreview => ({
  file: {
    uri: image_url,
  },
  id: uuidv4(),
  state: 'uploaded',
  ...a,
});

export const generateAudioAttachment = (a?: Partial<Attachment>): Attachment => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  image_url,
  text: uuidv4(),
  title: uuidv4(),
  type: 'audio',
  ...a,
});

export const generateFileAttachment = (a?: Partial<Attachment>): Attachment => ({
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_size: 1337,
  mime_type: uuidv4(),
  text: uuidv4(),
  title: uuidv4(),
  type: 'file',
  ...a,
});

export const generateFileUploadPreview = (a?: Partial<UploadPreview>): UploadPreview => ({
  file: {
    name: 'dummy.pdf',
    type: 'file',
    ...a,
  },
  id: uuidv4(),
  state: 'uploaded',
  ...a,
});

export const generateCardAttachment = (a?: Partial<Attachment>): Attachment => ({
  image_url,
  og_scrape_url: uuidv4(),
  text: uuidv4(),
  thumb_url: image_url,
  title: uuidv4(),
  title_link: uuidv4(),
  ...a,
});

export const generateImgurAttachment = (): Attachment => generateCardAttachment({ type: 'imgur' });

export const generateGiphyAttachment = (): Attachment => generateCardAttachment({ type: 'giphy' });
