import { NativeEventEmitter } from 'react-native';

const STREAM_MULTIPART_UPLOAD_PROGRESS_EVENT = 'streamMultipartUploadProgress';
const CANCELED_ERROR_CODE = 'ERR_CANCELED';

export type NativeMultipartAbortSignal = {
  aborted: boolean;
  addEventListener?: (...args: unknown[]) => unknown;
  onabort?: ((...args: unknown[]) => unknown) | null;
  removeEventListener?: (...args: unknown[]) => unknown;
};

export type NativeMultipartUploadHeader = {
  name: string;
  value: string;
};

export type NativeMultipartUploadPart =
  | {
      fieldName: string;
      kind: 'file';
      fileName: string;
      mimeType?: string;
      uri: string;
    }
  | {
      fieldName: string;
      kind: 'text';
      value: string;
    };

export type NativeMultipartUploaderProgressConfig = {
  count?: number;
  intervalMs?: number;
};

export type NativeMultipartUploadProgressConfig = NativeMultipartUploaderProgressConfig & {
  /**
   * Maximum progress percentage reported while the native request body is still being sent.
   * Completion is represented by the upload request resolving and the upload indicator being removed.
   *
   * @default 90
   */
  completionProgressCap?: number;
};

export type NativeMultipartUploadProgressEvent = {
  loaded: number;
  total?: number | null;
  uploadId: string;
};

export type NativeMultipartUploadNativeResponse = {
  body: string;
  headers?: ReadonlyArray<NativeMultipartUploadHeader> | null;
  status: number;
  statusText?: string | null;
};

export type NativeMultipartUploadResult = {
  body: string;
  headers?: Record<string, string>;
  status: number;
  statusText?: string;
};

export type NativeMultipartUploadRequest = {
  headers: Record<string, string>;
  method: string;
  onProgress?: (progress: { loaded: number; total?: number }) => void;
  parts: NativeMultipartUploadPart[];
  progress?: NativeMultipartUploadProgressConfig;
  signal?: NativeMultipartAbortSignal;
  timeoutMs?: number;
  url: string;
};

export type NativeMultipartUploaderRequest = Omit<NativeMultipartUploadRequest, 'progress'> & {
  progress?: NativeMultipartUploaderProgressConfig;
  uploadId: string;
};

export type NativeMultipartUpload = (
  request: NativeMultipartUploadRequest,
) => Promise<NativeMultipartUploadResult | undefined> | never;

export type NativeMultipartUploader = (
  request: NativeMultipartUploaderRequest,
) => Promise<NativeMultipartUploadResult>;

export type NativeMultipartUploaderModule = {
  addListener(eventType: string): void;
  cancelUpload(uploadId: string): Promise<void>;
  removeListeners(count: number): void;
  uploadMultipart(
    uploadId: string,
    url: string,
    method: string,
    headers: ReadonlyArray<NativeMultipartUploadHeader>,
    parts: ReadonlyArray<NativeMultipartUploadPart>,
    progress?: NativeMultipartUploaderProgressConfig,
    timeoutMs?: number | null,
  ): Promise<NativeMultipartUploadNativeResponse>;
};

export type NativeMultipartUploadEventEmitter = {
  addListener(
    eventType: string,
    listener: (event: NativeMultipartUploadProgressEvent) => void,
  ): { remove: () => void };
};

export type NativeMultipartCanceledError = Error & {
  __CANCEL__: true;
  code: typeof CANCELED_ERROR_CODE;
};

type CreateNativeMultipartUploaderOptions = {
  eventEmitter?: NativeMultipartUploadEventEmitter;
};

type CreateNativeMultipartUploadOptions = {
  getLocalAssetUri?: ((uri: string) => Promise<string | null | undefined>) | null;
  uploadIdFactory?: () => string;
  uploadMultipart?: NativeMultipartUploader;
};

const createDefaultUploadId = () =>
  `stream-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createCanceledError = (): NativeMultipartCanceledError => {
  const error = new Error('Request aborted') as NativeMultipartCanceledError;
  error.name = 'CanceledError';
  error.code = CANCELED_ERROR_CODE;
  // eslint-disable-next-line no-underscore-dangle -- Axios marks cancellation with this legacy field, and callers still use axios.isCancel.
  error.__CANCEL__ = true;
  return error;
};

const toUploadHeaders = (headers: Record<string, string>): NativeMultipartUploadHeader[] =>
  Object.entries(headers).map(([name, value]) => ({ name, value }));

const fromUploadHeaders = (
  headers?: ReadonlyArray<NativeMultipartUploadHeader> | null,
): Record<string, string> | undefined => {
  if (!headers?.length) {
    return undefined;
  }

  return headers.reduce<Record<string, string>>((acc, header) => {
    acc[header.name] = header.value;
    return acc;
  }, {});
};

const addAbortHandler = (signal: NativeMultipartAbortSignal | undefined, onAbort: () => void) => {
  if (!signal) {
    return () => undefined;
  }

  let handled = false;
  const handleAbort = () => {
    if (handled) {
      return;
    }

    handled = true;
    onAbort();
  };

  if (typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', handleAbort, { once: true });
    return () => {
      signal.removeEventListener?.('abort', handleAbort);
    };
  }

  const previousOnAbort = signal.onabort;
  const chainedOnAbort = (...args: unknown[]) => {
    previousOnAbort?.(...args);
    handleAbort();
  };

  signal.onabort = chainedOnAbort;

  return () => {
    if (signal.onabort === chainedOnAbort) {
      signal.onabort = previousOnAbort ?? null;
    }
  };
};

const getNativeProgressConfig = (
  progress?: NativeMultipartUploadProgressConfig,
): NativeMultipartUploaderProgressConfig | undefined => {
  if (!progress) {
    return undefined;
  }

  const nativeProgressConfig = { ...progress };
  delete nativeProgressConfig.completionProgressCap;

  return Object.keys(nativeProgressConfig).length ? nativeProgressConfig : undefined;
};

const isPhotoLibraryUri = (uri: string) => {
  const normalizedUri = uri.toLowerCase();
  return normalizedUri.startsWith('ph://') || normalizedUri.startsWith('assets-library://');
};

const sanitizeResolvedFileUri = (uri: string) => {
  const normalizedUri = uri.startsWith('/') ? `file://${uri}` : uri;

  if (!normalizedUri.startsWith('file://')) {
    return normalizedUri;
  }

  return normalizedUri.split('#')[0].split('?')[0];
};

const resolvePartUri = async (
  part: NativeMultipartUploadPart,
  getLocalAssetUri: CreateNativeMultipartUploadOptions['getLocalAssetUri'],
): Promise<NativeMultipartUploadPart> => {
  if (
    part.kind !== 'file' ||
    typeof getLocalAssetUri !== 'function' ||
    !isPhotoLibraryUri(part.uri)
  ) {
    return part;
  }

  try {
    const resolvedUri = await getLocalAssetUri(part.uri);

    return {
      ...part,
      uri: resolvedUri ? sanitizeResolvedFileUri(resolvedUri) : part.uri,
    };
  } catch {
    return part;
  }
};

export const createNativeMultipartUploader = (
  nativeModule: NativeMultipartUploaderModule | null | undefined,
  options: CreateNativeMultipartUploaderOptions = {},
): NativeMultipartUploader | undefined => {
  if (!nativeModule) {
    return undefined;
  }

  const multipartUploadEventEmitter = options.eventEmitter ?? new NativeEventEmitter(nativeModule);

  return async ({
    headers,
    method,
    onProgress,
    parts,
    progress,
    signal,
    timeoutMs,
    uploadId,
    url,
  }: NativeMultipartUploaderRequest): Promise<NativeMultipartUploadResult> => {
    let progressSubscription:
      | {
          remove: () => void;
        }
      | undefined;
    let uploadStarted = false;

    const abortUpload = async () => {
      try {
        await nativeModule.cancelUpload(uploadId);
      } catch {
        // Ignore cancellation races for already-finished uploads.
      }
    };

    const handleAbort = () => {
      if (uploadStarted) {
        abortUpload().catch(() => undefined);
      }
    };

    if (signal?.aborted) {
      throw createCanceledError();
    }

    const removeAbortListener = addAbortHandler(signal, handleAbort);

    if (signal?.aborted) {
      removeAbortListener();
      throw createCanceledError();
    }

    if (onProgress) {
      progressSubscription = multipartUploadEventEmitter.addListener(
        STREAM_MULTIPART_UPLOAD_PROGRESS_EVENT,
        (event: NativeMultipartUploadProgressEvent) => {
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

    try {
      uploadStarted = true;
      const response = await nativeModule.uploadMultipart(
        uploadId,
        url,
        method,
        toUploadHeaders(headers),
        parts,
        progress ?? {},
        timeoutMs,
      );

      if (signal?.aborted) {
        throw createCanceledError();
      }

      return {
        body: response.body,
        headers: fromUploadHeaders(response.headers),
        status: response.status,
        statusText: typeof response.statusText === 'string' ? response.statusText : undefined,
      };
    } catch (error) {
      if (signal?.aborted) {
        throw createCanceledError();
      }

      throw error;
    } finally {
      progressSubscription?.remove();
      removeAbortListener();
    }
  };
};

export const createNativeMultipartUpload = ({
  getLocalAssetUri,
  uploadIdFactory = createDefaultUploadId,
  uploadMultipart,
}: CreateNativeMultipartUploadOptions): NativeMultipartUpload | undefined => {
  if (!uploadMultipart) {
    return undefined;
  }

  return async ({
    headers,
    method,
    onProgress,
    parts,
    progress,
    signal,
    timeoutMs,
    url,
  }: NativeMultipartUploadRequest) => {
    const resolvedParts = await Promise.all(
      parts.map((part) => resolvePartUri(part, getLocalAssetUri)),
    );

    return uploadMultipart({
      headers,
      method,
      onProgress,
      parts: resolvedParts,
      progress: getNativeProgressConfig(progress),
      signal,
      timeoutMs,
      uploadId: uploadIdFactory(),
      url,
    });
  };
};
