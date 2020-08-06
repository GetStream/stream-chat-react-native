import { v4 as uuidv4 } from 'uuid';

const image_url = 'http://www.jackblack.com/tenac_iousd.bmp';

export const generateAttachmentAction = (a) => ({
  value: uuidv4(),
  name: uuidv4(),
  text: uuidv4(),
  ...a,
});

export const generateVideoAttachment = (a) => ({
  type: 'media',
  title: uuidv4(),
  mime_type: 'video/mp4',
  asset_url:
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  ...a,
});

export const generateImageAttachment = (a) => ({
  type: 'image',
  title: uuidv4(),
  title_link: 'https://getstream.io',
  text: uuidv4(),
  image_url: uuidv4(),
  thumb_url: uuidv4(),
  ...a,
});

export const generateAudioAttachment = (a) => ({
  type: 'audio',
  title: uuidv4(),
  text: uuidv4(),
  description: uuidv4(),
  asset_url: 'http://www.jackblack.com/tribute.mp3',
  image_url,
  ...a,
});

export const generateFileAttachment = (a) => ({
  type: 'file',
  mime_type: uuidv4(),
  title: uuidv4(),
  asset_url:
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  file_size: 1337,
  text: uuidv4(),
  description: uuidv4(),
  ...a,
});

export const generateCardAttachment = (a) => ({
  title: uuidv4(),
  title_link: uuidv4(),
  og_scrape_url: uuidv4(),
  image_url,
  thumb_url: image_url,
  text: uuidv4(),
  ...a,
});

export const generateImgurAttachment = () =>
  generateCardAttachment({ type: 'imgur' });

export const generateGiphyAttachment = () =>
  generateCardAttachment({ type: 'giphy' });
