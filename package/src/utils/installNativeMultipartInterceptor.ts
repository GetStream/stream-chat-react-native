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

type UploadProgressEvent = {
  lengthComputable: boolean;
  loaded: number;
  progress?: number;
  total?: number;
};

type AxiosHeadersLike = {
  toJSON?: () => Record<string, unknown>;
};

type AxiosLikeRequestConfig = {
  adapter?: unknown;
  data?: unknown;
  headers?: AxiosHeadersLike | Record<string, unknown>;
  method?: string;
  onUploadProgress?: (event: UploadProgressEvent) => void;
  uploadProgressOptions?: NativeMultipartUploadProgressConfig;
  uploadProgress?: (event: UploadProgressEvent) => void;
  params?: unknown;
  signal?: AbortSignal;
  url?: string;
};

const STREAM_NATIVE_MULTIPART_REQUEST = Symbol('stream-native-multipart-request');

const installedInterceptors = new WeakMap<
  StreamChat,
  {
    count: number;
    interceptorId: number;
  }
>();

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

const normalizeHeaders = (headers: AxiosLikeRequestConfig['headers']) => {
  const rawHeaders =
    headers && typeof headers === 'object' && 'toJSON' in headers && headers.toJSON
      ? headers.toJSON()
      : headers;

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

const createNativeMultipartRequest = (
  client: StreamChat,
  config: AxiosLikeRequestConfig,
): NativeMultipartUploadRequest | null => {
  const entries = getFormDataEntries(config.data);

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

  return {
    headers: normalizeHeaders(config.headers),
    method: (config.method || 'POST').toUpperCase(),
    parts,
    progress: config.uploadProgressOptions,
    signal: config.signal,
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

const getUploadProgressCallbacks = (config: AxiosLikeRequestConfig) => {
  const callbacks = [config.onUploadProgress, config.uploadProgress].filter(
    (callback): callback is NonNullable<typeof config.onUploadProgress> =>
      typeof callback === 'function',
  );

  return Array.from(new Set(callbacks));
};

const createUploadProgressEvent = ({ loaded, total }: { loaded: unknown; total?: unknown }) => {
  const normalizedLoaded = toFiniteNumber(loaded) ?? 0;
  const normalizedTotal = toFiniteNumber(total);

  return {
    lengthComputable: typeof normalizedTotal === 'number' && normalizedTotal > 0,
    loaded: normalizedLoaded,
    progress:
      typeof normalizedTotal === 'number' && normalizedTotal > 0
        ? normalizedLoaded / normalizedTotal
        : undefined,
    total: normalizedTotal,
  };
};

const nativeMultipartAxiosAdapter = async (config: AxiosLikeRequestConfig) => {
  const request = (
    config as AxiosLikeRequestConfig & {
      [STREAM_NATIVE_MULTIPART_REQUEST]?: NativeMultipartUploadRequest;
    }
  )[STREAM_NATIVE_MULTIPART_REQUEST];

  if (!request) {
    throw new Error('Missing native multipart upload request');
  }

  const uploadProgressCallbacks = getUploadProgressCallbacks(config);

  const response = await NativeHandlers.multipartUpload({
    ...request,
    onProgress: uploadProgressCallbacks.length
      ? ({ loaded, total }) => {
          const event = createUploadProgressEvent({ loaded, total });
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

export const installNativeMultipartInterceptor = (client: StreamChat) => {
  if (!isNativeMultipartUploadAvailable()) {
    return () => undefined;
  }

  const existing = installedInterceptors.get(client);

  if (existing) {
    existing.count += 1;

    return () => {
      existing.count -= 1;

      if (existing.count === 0) {
        client.axiosInstance.interceptors.request.eject(existing.interceptorId);
        installedInterceptors.delete(client);
      }
    };
  }

  const interceptorId = client.axiosInstance.interceptors.request.use((config) => {
    const nativeMultipartRequest = createNativeMultipartRequest(
      client,
      config as AxiosLikeRequestConfig,
    );

    if (!nativeMultipartRequest) {
      return config;
    }

    return {
      ...config,
      adapter: nativeMultipartAxiosAdapter,
      [STREAM_NATIVE_MULTIPART_REQUEST]: nativeMultipartRequest,
    };
  });

  installedInterceptors.set(client, { count: 1, interceptorId });

  return () => {
    const current = installedInterceptors.get(client);

    if (!current) {
      return;
    }

    current.count -= 1;

    if (current.count === 0) {
      client.axiosInstance.interceptors.request.eject(current.interceptorId);
      installedInterceptors.delete(client);
    }
  };
};
