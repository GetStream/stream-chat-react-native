import { createNativeMultipartUpload } from 'stream-chat-react-native-core';

import { getLocalAssetUri } from './getLocalAssetUri';

import { uploadMultipart } from '../native/multipartUploader';

export const multipartUpload = createNativeMultipartUpload({
  getLocalAssetUri,
  uploadMultipart,
});
