import { createNativeMultipartUpload } from 'stream-chat-react-native-core';

import { uploadMultipart } from '../native/multipartUploader';
import { getLocalAssetUri } from '../optionalDependencies/getLocalAssetUri';

export const multipartUpload = createNativeMultipartUpload({
  getLocalAssetUri,
  uploadMultipart,
});
