import {
  createNativeMultipartUpload,
  createNativeMultipartUploader,
  NativeMultipartAbortSignal,
  NativeMultipartUploadEventEmitter,
  NativeMultipartUploadProgressEvent,
} from '../nativeMultipartUpload';

const progressEventName = 'streamMultipartUploadProgress';

const filePart = {
  fieldName: 'file',
  fileName: 'test.jpg',
  kind: 'file' as const,
  mimeType: 'image/jpeg',
  uri: 'file:///tmp/test.jpg',
};

const createNativeModule = () => ({
  addListener: jest.fn(),
  cancelUpload: jest.fn(() => Promise.resolve()),
  removeListeners: jest.fn(),
  uploadMultipart: jest.fn(() =>
    Promise.resolve({
      body: 'ok',
      headers: [{ name: 'x-test', value: 'yes' }],
      status: 201,
      statusText: 'Created',
    }),
  ),
});

const createEventEmitter = () => {
  const listeners = new Map<string, Set<(event: NativeMultipartUploadProgressEvent) => void>>();
  const subscriptions: Array<{ remove: jest.Mock }> = [];

  const eventEmitter: NativeMultipartUploadEventEmitter & {
    emit: (eventType: string, event: NativeMultipartUploadProgressEvent) => void;
    subscriptions: Array<{ remove: jest.Mock }>;
  } = {
    addListener: jest.fn((eventType, listener) => {
      const eventListeners = listeners.get(eventType) ?? new Set();
      eventListeners.add(listener);
      listeners.set(eventType, eventListeners);

      const subscription = {
        remove: jest.fn(() => {
          eventListeners.delete(listener);
        }),
      };
      subscriptions.push(subscription);
      return subscription;
    }),
    emit: (eventType, event) => {
      listeners.get(eventType)?.forEach((listener) => listener(event));
    },
    subscriptions,
  };

  return eventEmitter;
};

describe('nativeMultipartUpload', () => {
  it('does not create a native uploader when the native module is missing', () => {
    expect(createNativeMultipartUploader(null)).toBeUndefined();
  });

  it('passes requests to the native module and forwards matching progress events', async () => {
    const nativeModule = createNativeModule();
    const eventEmitter = createEventEmitter();
    let resolveUpload: (response: Awaited<ReturnType<typeof nativeModule.uploadMultipart>>) => void;
    nativeModule.uploadMultipart.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );
    const uploadMultipart = createNativeMultipartUploader(nativeModule, { eventEmitter });
    const onProgress = jest.fn();

    const responsePromise = uploadMultipart?.({
      headers: { Authorization: 'token' },
      method: 'POST',
      onProgress,
      parts: [filePart],
      progress: { count: 10 },
      timeoutMs: 1234,
      uploadId: 'upload-id',
      url: 'https://example.com/upload',
    });

    eventEmitter.emit(progressEventName, {
      loaded: 5,
      total: 10,
      uploadId: 'other-upload-id',
    });
    eventEmitter.emit(progressEventName, {
      loaded: 10,
      total: null,
      uploadId: 'upload-id',
    });
    resolveUpload!({
      body: 'ok',
      headers: [{ name: 'x-test', value: 'yes' }],
      status: 201,
      statusText: null,
    });

    await expect(responsePromise).resolves.toEqual({
      body: 'ok',
      headers: { 'x-test': 'yes' },
      status: 201,
      statusText: undefined,
    });
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({ loaded: 10, total: undefined });
    expect(nativeModule.uploadMultipart).toHaveBeenCalledWith(
      'upload-id',
      'https://example.com/upload',
      'POST',
      [{ name: 'Authorization', value: 'token' }],
      [filePart],
      { count: 10 },
      1234,
    );
    expect(eventEmitter.subscriptions[0].remove).toHaveBeenCalledTimes(1);
  });

  it('throws an Axios-compatible cancellation error without pre-canceling native uploads', async () => {
    const nativeModule = createNativeModule();
    const uploadMultipart = createNativeMultipartUploader(nativeModule, {
      eventEmitter: createEventEmitter(),
    });

    await expect(
      uploadMultipart?.({
        headers: {},
        method: 'POST',
        parts: [filePart],
        signal: { aborted: true },
        uploadId: 'upload-id',
        url: 'https://example.com/upload',
      }),
    ).rejects.toMatchObject({
      __CANCEL__: true,
      code: 'ERR_CANCELED',
      name: 'CanceledError',
    });
    expect(nativeModule.cancelUpload).not.toHaveBeenCalled();
    expect(nativeModule.uploadMultipart).not.toHaveBeenCalled();
  });

  it('supports onabort-only signals and restores the previous handler', async () => {
    const nativeModule = createNativeModule();
    const eventEmitter = createEventEmitter();
    let rejectUpload: (error: Error) => void;
    nativeModule.uploadMultipart.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectUpload = reject;
        }),
    );
    const uploadMultipart = createNativeMultipartUploader(nativeModule, { eventEmitter });
    const previousOnAbort = jest.fn();
    const signal: NativeMultipartAbortSignal = {
      aborted: false,
      onabort: previousOnAbort,
    };

    const responsePromise = uploadMultipart?.({
      headers: {},
      method: 'POST',
      parts: [filePart],
      signal,
      uploadId: 'upload-id',
      url: 'https://example.com/upload',
    });

    signal.aborted = true;
    signal.onabort?.('abort-event');
    rejectUpload!(new Error('native aborted'));

    await expect(responsePromise).rejects.toMatchObject({
      __CANCEL__: true,
      code: 'ERR_CANCELED',
      name: 'CanceledError',
    });
    expect(previousOnAbort).toHaveBeenCalledWith('abort-event');
    expect(nativeModule.cancelUpload).toHaveBeenCalledWith('upload-id');
    expect(signal.onabort).toBe(previousOnAbort);
  });

  it('does not create a multipart upload handler without an uploader', () => {
    expect(createNativeMultipartUpload({ uploadMultipart: undefined })).toBeUndefined();
  });

  it('resolves photo library URIs and strips non-native progress options', async () => {
    const uploadMultipart = jest.fn(() =>
      Promise.resolve({
        body: 'ok',
        status: 200,
      }),
    );
    const getLocalAssetUri = jest.fn(() => Promise.resolve('/tmp/image.jpg?token=1#fragment'));
    const multipartUpload = createNativeMultipartUpload({
      getLocalAssetUri,
      uploadIdFactory: () => 'generated-upload-id',
      uploadMultipart,
    });

    await multipartUpload?.({
      headers: {},
      method: 'POST',
      parts: [{ ...filePart, uri: 'ph://asset-id' }],
      progress: {
        completionProgressCap: 75,
        count: 10,
        intervalMs: 50,
      },
      url: 'https://example.com/upload',
    });

    expect(getLocalAssetUri).toHaveBeenCalledWith('ph://asset-id');
    expect(uploadMultipart).toHaveBeenCalledWith(
      expect.objectContaining({
        parts: [{ ...filePart, uri: 'file:///tmp/image.jpg' }],
        progress: {
          count: 10,
          intervalMs: 50,
        },
        uploadId: 'generated-upload-id',
      }),
    );
  });

  it('falls back to the original photo library URI when JS resolution fails', async () => {
    const uploadMultipart = jest.fn(() =>
      Promise.resolve({
        body: 'ok',
        status: 200,
      }),
    );
    const multipartUpload = createNativeMultipartUpload({
      getLocalAssetUri: jest.fn(() => Promise.reject(new Error('resolution failed'))),
      uploadIdFactory: () => 'generated-upload-id',
      uploadMultipart,
    });

    await multipartUpload?.({
      headers: {},
      method: 'POST',
      parts: [{ ...filePart, uri: 'assets-library://asset-id' }],
      url: 'https://example.com/upload',
    });

    expect(uploadMultipart).toHaveBeenCalledWith(
      expect.objectContaining({
        parts: [{ ...filePart, uri: 'assets-library://asset-id' }],
      }),
    );
  });
});
