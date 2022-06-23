import { v4 as uuidv4 } from 'uuid';

const image_url = 'http://www.jackblack.com/tenac_iousd.bmp';

export const generateAttachmentAction = (a) => ({
  name: uuidv4(),
  text: uuidv4(),
  value: uuidv4(),
  ...a,
});

export const generateVideoAttachment = (a) => ({
  asset_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  mime_type: 'video/mp4',
  thumb_url:
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  title: uuidv4(),
  type: 'video',
  ...a,
});

export const generateImageAttachment = (a) => ({
  image_url: uuidv4(),
  title: uuidv4(),
  type: 'image',
  ...a,
});

export const generateImageUploadPreview = (a) => ({
  file: {
    uri: image_url,
  },
  id: uuidv4(),
  state: 'uploaded',
  ...a,
});

export const generateAudioAttachment = (a) => ({
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  description: uuidv4(),
  image_url,
  text: uuidv4(),
  title: uuidv4(),
  type: 'audio',
  ...a,
});

export const generateFileAttachment = (a) => ({
  asset_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  description: uuidv4(),
  file_size: 1337,
  mime_type: uuidv4(),
  text: uuidv4(),
  title: uuidv4(),
  type: 'file',
  ...a,
});

export const generateFileUploadPreview = (a) => ({
  file: {
    name: 'dummy.pdf',
    type: 'file',
    ...a,
  },
  id: uuidv4(),
  state: 'uploaded',
  ...a,
});

export const generateCardAttachment = (a) => ({
  image_url,
  og_scrape_url: uuidv4(),
  text: uuidv4(),
  thumb_url: image_url,
  title: uuidv4(),
  title_link: uuidv4(),
  ...a,
});

export const generateImgurAttachment = () => generateCardAttachment({ type: 'imgur' });

export const generateGiphyAttachment = () => generateCardAttachment({ type: 'giphy' });
