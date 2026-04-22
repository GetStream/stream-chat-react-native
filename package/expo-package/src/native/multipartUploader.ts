import { NativeEventEmitter } from 'react-native';

import NativeStreamMultipartUploader, {
  type UploadHeader,
  type UploadPart,
  type UploadProgressConfig,
  type UploadProgressEvent,
  type UploadResponse as NativeUploadResponse,
} from './NativeStreamMultipartUploader';

import type { NativeMultipartAbortSignal } from '../../../src/native';

const STREAM_MULTIPART_UPLOAD_PROGRESS_EVENT = 'streamMultipartUploadProgress';

const multipartUploadEventEmitter = new NativeEventEmitter(NativeStreamMultipartUploader);

const toUploadHeaders = (headers: Record<string, string>): UploadHeader[] =>
  Object.entries(headers).map(([name, value]) => ({ name, value }));

const fromUploadHeaders = (
  headers?: ReadonlyArray<UploadHeader> | null,
): Record<string, string> | undefined => {
  if (!headers?.length) {
    return undefined;
  }

  return headers.reduce<Record<string, string>>((acc, header) => {
    acc[header.name] = header.value;
    return acc;
  }, {});
};

const createAbortError = () => {
  const error = new Error('Request aborted');
  error.name = 'CanceledError';
  return error;
};

type MultipartUploadRequest = {
  headers: Record<string, string>;
  method: string;
  onProgress?: (event: { loaded: number; total?: number }) => void;
  parts: UploadPart[];
  progress?: UploadProgressConfig;
  signal?: NativeMultipartAbortSignal;
  timeoutMs?: number;
  uploadId: string;
  url: string;
};

type MultipartUploadResponse = Omit<NativeUploadResponse, 'headers'> & {
  headers?: Record<string, string>;
};

export const uploadMultipart = async ({
  headers,
  method,
  onProgress,
  parts,
  progress,
  signal,
  timeoutMs,
  uploadId,
  url,
}: MultipartUploadRequest): Promise<MultipartUploadResponse> => {
  let progressSubscription:
    | {
        remove: () => void;
      }
    | undefined;
  let removedAbortListener = false;

  const abortUpload = async () => {
    try {
      await NativeStreamMultipartUploader.cancelUpload(uploadId);
    } catch {
      // Ignore cancellation races for already-finished uploads.
    }
  };

  const removeAbortListener = () => {
    if (!removedAbortListener) {
      signal?.removeEventListener('abort', handleAbort);
      removedAbortListener = true;
    }
  };

  const handleAbort = () => {
    abortUpload().catch(() => undefined);
  };

  if (signal?.aborted) {
    await abortUpload();
    throw createAbortError();
  }

  if (onProgress) {
    progressSubscription = multipartUploadEventEmitter.addListener(
      STREAM_MULTIPART_UPLOAD_PROGRESS_EVENT,
      (event: UploadProgressEvent) => {
        if (event.uploadId !== uploadId) {
          return;
        }

        onProgress({
          loaded: event.loaded,
          total: typeof event.total === 'number' ? event.total : undefined,
        });
      },
    );
  }

  signal?.addEventListener('abort', handleAbort, { once: true });

  try {
    const response = await NativeStreamMultipartUploader.uploadMultipart(
      uploadId,
      url,
      method,
      toUploadHeaders(headers),
      parts,
      progress ?? {},
      timeoutMs,
    );

    if (signal?.aborted) {
      throw createAbortError();
    }

    return {
      ...response,
      headers: fromUploadHeaders(response.headers),
    };
  } catch (error) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    throw error;
  } finally {
    progressSubscription?.remove();
    removeAbortListener();
  }
};
