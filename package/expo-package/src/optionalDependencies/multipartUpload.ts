import type {
  NativeMultipartUploadPart,
  NativeMultipartUploadRequest,
} from 'stream-chat-react-native-core';

import { getLocalAssetUri } from './getLocalAssetUri';

import { uploadMultipart } from '../native/multipartUploader';

const sanitizeResolvedFileUri = (uri: string) => {
  const normalizedUri = uri.startsWith('/') ? `file://${uri}` : uri;

  if (!normalizedUri.startsWith('file://')) {
    return normalizedUri;
  }

  return normalizedUri.split('#')[0].split('?')[0];
};

const resolvePartUri = async (part: NativeMultipartUploadPart) => {
  if (
    part.kind !== 'file' ||
    typeof getLocalAssetUri !== 'function' ||
    !(part.uri.startsWith('ph://') || part.uri.startsWith('assets-library://'))
  ) {
    return part;
  }

  const resolvedUri = await getLocalAssetUri(part.uri);

  return {
    ...part,
    uri: resolvedUri ? sanitizeResolvedFileUri(resolvedUri) : part.uri,
  };
};

export const multipartUpload = async ({
  headers,
  method,
  onProgress,
  parts,
  progress,
  signal,
  timeoutMs,
  url,
}: NativeMultipartUploadRequest) => {
  const resolvedParts = await Promise.all(parts.map(resolvePartUri));

  return uploadMultipart({
    headers,
    method,
    onProgress,
    parts: resolvedParts,
    progress,
    signal,
    timeoutMs,
    uploadId: `stream-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    url,
  });
};
