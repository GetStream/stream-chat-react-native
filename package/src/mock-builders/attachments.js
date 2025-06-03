import { generateRandomId } from '../../utils/utils';

export const generateImageAttachment = (a) => ({
  fallback: generateRandomId() + '.png',
  image_url: 'https://' + generateRandomId() + '.png',
  type: 'image',
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
