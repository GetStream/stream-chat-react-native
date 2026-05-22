import { createNativeMultipartUploader } from 'stream-chat-react-native-core';

import NativeStreamMultipartUploader from './NativeStreamMultipartUploader';

export const uploadMultipart = createNativeMultipartUploader(NativeStreamMultipartUploader);
