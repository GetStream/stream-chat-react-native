import type { AxiosAdapter, AxiosProgressEvent, InternalAxiosRequestConfig } from 'axios';
import type { StreamChat } from 'stream-chat';

import {
  isNativeMultipartUploadAvailable,
  NativeHandlers,
  NativeMultipartUploadProgressConfig,
  NativeMultipartUploadRequest,
} from '../native';

type FormDataPartValue =
  | string
  | {
      contentType?: string;
      name?: string;
      type?: string;
      uri: string;
    };

type NativeMultipartAxiosRequestConfig = InternalAxiosRequestConfig & {
  onUploadProgress?: (event: AxiosProgressEvent) => void;
  uploadProgressOptions?: NativeMultipartUploadProgressConfig;
  uploadProgress?: (event: AxiosProgressEvent) => void;
};

const DEFAULT_COMPLETION_PROGRESS_CAP = 90;

const installedClients = new WeakSet<StreamChat>();

const getFormDataEntries = (data: unknown): [string, FormDataPartValue][] | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if ('entries' in data && typeof data.entries === 'function') {
    return Array.from(data.entries()) as [string, FormDataPartValue][];
  }

  const parts = Reflect.get(data, '_parts');

  if (Array.isArray(parts)) {
    return parts as [string, FormDataPartValue][];
  }

  return null;
};

const normalizeHeaders = (
  headers: NativeMultipartAxiosRequestConfig['headers'],
): Record<string, string> => {
  const rawHeaders = headers?.toJSON() ?? {};
  const normalizedHeaders: Record<string, string> = {};

  Object.entries(rawHeaders ?? {}).forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    normalizedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
  });

  return normalizedHeaders;
};

const getFileNameFromUri = (uri: string) => uri.split('/').filter(Boolean).pop() || 'file';

const getNativeProgressOptions = (
  progress?: NativeMultipartUploadProgressConfig,
): NativeMultipartUploadProgressConfig | undefined => {
  if (!progress) {
    return undefined;
  }

  const nativeProgressOptions = { ...progress };
  delete nativeProgressOptions.completionProgressCap;

  return Object.keys(nativeProgressOptions).length ? nativeProgressOptions : undefined;
};

const getNativeMultipartParts = (data: unknown): NativeMultipartUploadRequest['parts'] | null => {
  const entries = getFormDataEntries(data);

  if (!entries) {
    return null;
  }

  const parts: NativeMultipartUploadRequest['parts'] = [];

  for (const [fieldName, value] of entries) {
    if (typeof value === 'string') {
      parts.push({
        fieldName,
        kind: 'text',
        value,
      });
      continue;
    }

    if (value && typeof value === 'object' && 'uri' in value && typeof value.uri === 'string') {
      parts.push({
        fieldName,
        fileName: value.name || getFileNameFromUri(value.uri),
        kind: 'file',
        mimeType: value.type || value.contentType,
        uri: value.uri,
      });
      continue;
    }

    return null;
  }

  if (!parts.some((part) => part.kind === 'file')) {
    return null;
  }

  return parts;
};

const createNativeMultipartRequest = (
  client: StreamChat,
  config: NativeMultipartAxiosRequestConfig,
): NativeMultipartUploadRequest | null => {
  const parts = getNativeMultipartParts(config.data);

  if (!parts) {
    return null;
  }

  return {
    headers: normalizeHeaders(config.headers),
    method: (config.method || 'POST').toUpperCase(),
    parts,
    progress: getNativeProgressOptions(config.uploadProgressOptions),
    signal: config.signal,
    timeoutMs: config.timeout,
    url: client.axiosInstance.getUri(config),
  };
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const getCompletionProgressCap = (config: NativeMultipartAxiosRequestConfig) => {
  const cap = toFiniteNumber(config.uploadProgressOptions?.completionProgressCap);
  if (cap === undefined) {
    return DEFAULT_COMPLETION_PROGRESS_CAP;
  }

  return Math.min(100, Math.max(0, cap));
};

const getDisplayLoaded = ({
  completionProgressCap,
  loaded,
  total,
}: {
  completionProgressCap: number;
  loaded: number;
  total?: number;
}) => {
  if (typeof total !== 'number' || total <= 0) {
    return loaded;
  }

  return Math.min(loaded, total * (completionProgressCap / 100));
};

const getUploadProgressCallbacks = (config: NativeMultipartAxiosRequestConfig) => {
  const callbacks = [config.onUploadProgress, config.uploadProgress].filter(
    (callback): callback is NonNullable<typeof config.onUploadProgress> =>
      typeof callback === 'function',
  );

  return Array.from(new Set(callbacks));
};

const createUploadProgressEvent = ({
  bytes,
  loaded,
  total,
}: {
  bytes: unknown;
  loaded: unknown;
  total?: unknown;
}) => {
  const normalizedBytes = toFiniteNumber(bytes) ?? 0;
  const normalizedLoaded = toFiniteNumber(loaded) ?? 0;
  const normalizedTotal = toFiniteNumber(total);

  return {
    bytes: normalizedBytes,
    download: false,
    event: undefined,
    lengthComputable: typeof normalizedTotal === 'number' && normalizedTotal > 0,
    loaded: normalizedLoaded,
    progress:
      typeof normalizedTotal === 'number' && normalizedTotal > 0
        ? normalizedLoaded / normalizedTotal
        : undefined,
    total: normalizedTotal,
    upload: true,
  };
};

const nativeMultipartAxiosAdapter = async (
  request: NativeMultipartUploadRequest,
  config: NativeMultipartAxiosRequestConfig,
) => {
  const uploadProgressCallbacks = getUploadProgressCallbacks(config);
  const completionProgressCap = getCompletionProgressCap(config);
  let lastLoaded = 0;

  const response = await NativeHandlers.multipartUpload({
    ...request,
    onProgress: uploadProgressCallbacks.length
      ? ({ loaded, total }) => {
          const normalizedLoaded = toFiniteNumber(loaded) ?? 0;
          const normalizedTotal = toFiniteNumber(total);
          const displayLoaded = getDisplayLoaded({
            completionProgressCap,
            loaded: normalizedLoaded,
            total: normalizedTotal,
          });
          const event = createUploadProgressEvent({
            bytes: Math.max(0, displayLoaded - lastLoaded),
            loaded: displayLoaded,
            total: normalizedTotal,
          });
          lastLoaded = displayLoaded;
          uploadProgressCallbacks.forEach((callback) => callback(event));
        }
      : undefined,
  });

  if (!response) {
    throw new Error('Native multipart upload did not return a response');
  }

  return {
    config,
    data: response.body,
    headers: response.headers ?? {},
    request: null,
    status: response.status,
    statusText: response.statusText ?? '',
  };
};

const createNativeMultipartAdapter =
  (client: StreamChat): AxiosAdapter =>
  (config) => {
    // Built from the config the adapter receives, so it reflects everything that ran after routing:
    // request interceptors registered before this one (axios runs them after it) and
    // `transformRequest`.
    const nativeMultipartRequest = createNativeMultipartRequest(
      client,
      config as NativeMultipartAxiosRequestConfig,
    );

    if (!nativeMultipartRequest) {
      return Promise.reject(
        new Error(
          'Native multipart upload: the request body changed after it was routed to the native uploader.',
        ),
      );
    }

    return nativeMultipartAxiosAdapter(nativeMultipartRequest, config);
  };

/**
 * Routes file uploads through the native uploader by setting `adapter` on those requests only.
 *
 * The client's default adapter is deliberately left alone. Replacing it would mean resolving the
 * fallback (`['xhr', 'http', 'fetch']`) with `axios.getAdapter`, i.e. importing axios here — and
 * wherever that import resolves to a different copy than `stream-chat`'s, every request would fail
 * with that copy's `AxiosError`, which `stream-chat` does not recognise. Untouched, every other
 * request is resolved by `stream-chat`'s own axios.
 */
export const installNativeMultipartAdapter = (client: StreamChat) => {
  if (!isNativeMultipartUploadAvailable()) {
    return;
  }

  if (installedClients.has(client)) {
    return;
  }

  const nativeMultipartAdapter = createNativeMultipartAdapter(client);
  client.axiosInstance.interceptors.request.use((config) => {
    if (getNativeMultipartParts(config.data)) {
      config.adapter = nativeMultipartAdapter;
    }

    return config;
  });
  installedClients.add(client);
};
