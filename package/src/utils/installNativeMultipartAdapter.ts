import axios from 'axios';
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

type ResolvableAxiosAdapter = Parameters<typeof axios.getAdapter>[0];

const installedAdapters = new WeakSet<StreamChat>();

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

const createNativeMultipartRequest = (
  client: StreamChat,
  config: NativeMultipartAxiosRequestConfig,
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
  let lastLoaded = 0;

  const response = await NativeHandlers.multipartUpload({
    ...request,
    onProgress: uploadProgressCallbacks.length
      ? ({ loaded, total }) => {
          const normalizedLoaded = toFiniteNumber(loaded) ?? 0;
          const event = createUploadProgressEvent({
            bytes: Math.max(0, normalizedLoaded - lastLoaded),
            loaded: normalizedLoaded,
            total,
          });
          lastLoaded = normalizedLoaded;
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

const resolveAxiosAdapter = (adapter: ResolvableAxiosAdapter): AxiosAdapter =>
  axios.getAdapter(adapter);

const createNativeMultipartAwareAdapter = (
  client: StreamChat,
  fallbackAdapter: ResolvableAxiosAdapter,
): AxiosAdapter => {
  const resolvedFallbackAdapter = resolveAxiosAdapter(fallbackAdapter);

  return (config) => {
    const nativeMultipartRequest = createNativeMultipartRequest(
      client,
      config as NativeMultipartAxiosRequestConfig,
    );

    if (!nativeMultipartRequest) {
      return resolvedFallbackAdapter(config);
    }

    return nativeMultipartAxiosAdapter(nativeMultipartRequest, config);
  };
};

export const wrapAxiosAdapterWithNativeMultipart = (
  client: StreamChat,
  fallbackAdapter: ResolvableAxiosAdapter,
): AxiosAdapter => {
  if (!isNativeMultipartUploadAvailable()) {
    return resolveAxiosAdapter(fallbackAdapter);
  }

  return createNativeMultipartAwareAdapter(client, fallbackAdapter);
};

export const installNativeMultipartAdapter = (client: StreamChat) => {
  if (!isNativeMultipartUploadAvailable()) {
    return;
  }

  if (installedAdapters.has(client)) {
    return;
  }

  const previousAdapter = client.axiosInstance.defaults.adapter;
  client.axiosInstance.defaults.adapter = wrapAxiosAdapterWithNativeMultipart(
    client,
    previousAdapter,
  );
  installedAdapters.add(client);
};
