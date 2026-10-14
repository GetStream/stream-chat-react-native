import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios';

import { getTestClient } from '../../mock-builders/mock';
import {
  isNativeMultipartUploadAvailable,
  NativeHandlers,
  NativeMultipartUploadProgressConfig,
} from '../../native';
import { installNativeMultipartAdapter } from '../installNativeMultipartAdapter';

type NativeMultipartTestAxiosConfig = AxiosRequestConfig & {
  uploadProgress?: (event: AxiosProgressEvent) => void;
  uploadProgressOptions?: NativeMultipartUploadProgressConfig;
};

const nativeMultipartConfig = (config: NativeMultipartTestAxiosConfig) => config;

describe('installNativeMultipartAdapter', () => {
  const originalMultipartUpload = NativeHandlers.multipartUpload;

  beforeEach(() => {
    NativeHandlers.multipartUpload = jest.fn().mockResolvedValue({
      body: JSON.stringify({ file: 'https://example.com/file.jpg' }),
      headers: { 'content-type': 'application/json' },
      status: 200,
      statusText: 'OK',
    });
  });

  const preserveRequestData = (client: ReturnType<typeof getTestClient>) => {
    client.axiosInstance.defaults.transformRequest = [(data) => data];
  };

  afterEach(() => {
    NativeHandlers.multipartUpload = originalMultipartUpload;
    jest.clearAllMocks();
  });

  it('routes multipart requests through the native handler', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    installNativeMultipartAdapter(client);
    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
        ['user', JSON.stringify({ id: 'john' })],
      ],
    };

    const response = await client.axiosInstance.post('/uploads/image', formData, {
      headers: {
        Authorization: 'token',
        'Content-Type': 'multipart/form-data',
        'X-Stream-Client': 'stream-test',
      },
      params: {
        api_key: 'test-key',
      },
      timeout: 1234,
    });

    expect(defaultAdapter).not.toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token',
          'Content-Type': 'multipart/form-data',
          'X-Stream-Client': 'stream-test',
        }),
        timeoutMs: 1234,
        parts: [
          {
            fieldName: 'file',
            fileName: 'test.jpg',
            kind: 'file',
            mimeType: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
          {
            fieldName: 'user',
            kind: 'text',
            value: JSON.stringify({ id: 'john' }),
          },
        ],
      }),
    );
    expect(response.status).toBe(200);
  });

  it('leaves non-multipart requests on the fallback adapter', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    installNativeMultipartAdapter(client);

    await client.axiosInstance.post('/messages', { text: 'hello' });

    expect(defaultAdapter).toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).not.toHaveBeenCalled();
  });

  it('forwards native upload progress to axios upload progress callbacks', async () => {
    NativeHandlers.multipartUpload = jest.fn().mockImplementation(({ onProgress }) => {
      onProgress?.({
        loaded: '50' as unknown as number,
        total: '100' as unknown as number,
      });

      return {
        body: JSON.stringify({ file: 'https://example.com/file.jpg' }),
        headers: { 'content-type': 'application/json' },
        status: 200,
        statusText: 'OK',
      };
    });

    const client = getTestClient();
    preserveRequestData(client);
    installNativeMultipartAdapter(client);
    const onUploadProgress = jest.fn();
    const uploadProgress = jest.fn();
    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post(
      '/uploads/image',
      formData,
      nativeMultipartConfig({
        onUploadProgress,
        uploadProgressOptions: {
          count: 10,
          intervalMs: 25,
        },
        uploadProgress,
      }),
    );

    expect(onUploadProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        lengthComputable: true,
        loaded: 50,
        progress: 0.5,
        total: 100,
      }),
    );
    expect(uploadProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        lengthComputable: true,
        loaded: 50,
        progress: 0.5,
        total: 100,
      }),
    );
    expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: {
          count: 10,
          intervalMs: 25,
        },
      }),
    );
  });

  it('caps native multipart body progress to 90 percent while waiting for the response', async () => {
    NativeHandlers.multipartUpload = jest.fn().mockImplementation(({ onProgress }) => {
      onProgress?.({
        loaded: 100,
        total: 100,
      });

      return {
        body: JSON.stringify({ file: 'https://example.com/file.jpg' }),
        headers: { 'content-type': 'application/json' },
        status: 200,
        statusText: 'OK',
      };
    });

    const client = getTestClient();
    preserveRequestData(client);
    installNativeMultipartAdapter(client);
    const onUploadProgress = jest.fn();
    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post('/uploads/image', formData, { onUploadProgress });

    expect(onUploadProgress).toHaveBeenCalledTimes(1);
    expect(onUploadProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        bytes: 90,
        lengthComputable: true,
        loaded: 90,
        progress: 0.9,
        total: 100,
      }),
    );
  });

  it('allows overriding the native multipart completion progress cap', async () => {
    NativeHandlers.multipartUpload = jest.fn().mockImplementation(({ onProgress }) => {
      onProgress?.({
        loaded: 100,
        total: 100,
      });

      return {
        body: JSON.stringify({ file: 'https://example.com/file.jpg' }),
        headers: { 'content-type': 'application/json' },
        status: 200,
        statusText: 'OK',
      };
    });

    const client = getTestClient();
    preserveRequestData(client);
    installNativeMultipartAdapter(client);
    const onUploadProgress = jest.fn();
    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post(
      '/uploads/image',
      formData,
      nativeMultipartConfig({
        onUploadProgress,
        uploadProgressOptions: {
          completionProgressCap: 75,
          count: 10,
          intervalMs: 25,
        },
      }),
    );

    expect(onUploadProgress).toHaveBeenCalledTimes(1);
    expect(onUploadProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        bytes: 75,
        loaded: 75,
        progress: 0.75,
        total: 100,
      }),
    );
    expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: {
          count: 10,
          intervalMs: 25,
        },
      }),
    );
  });

  it('uses the final config after user request interceptors run', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    const interceptorId = client.axiosInstance.interceptors.request.use((config) => {
      config.headers.set('X-CDN-Route', 'custom-cdn');
      config.url = '/uploads/file';
      return config;
    });

    installNativeMultipartAdapter(client);
    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post('/uploads/image', formData, {
      headers: {
        Authorization: 'token',
      },
    });

    expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token',
          'X-CDN-Route': 'custom-cdn',
        }),
        url: expect.stringContaining('/uploads/file'),
      }),
    );
    expect(defaultAdapter).not.toHaveBeenCalled();

    client.axiosInstance.interceptors.request.eject(interceptorId);
  });

  it('installs only once per client', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const use = jest.spyOn(client.axiosInstance.interceptors.request, 'use');

    installNativeMultipartAdapter(client);
    installNativeMultipartAdapter(client);

    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post('/uploads/image', formData);

    expect(use).toHaveBeenCalledTimes(1);
    expect(NativeHandlers.multipartUpload).toHaveBeenCalledTimes(1);
  });

  it('leaves the default adapter for the client’s own axios to resolve', () => {
    const client = getTestClient();
    const defaultAdapter = client.axiosInstance.defaults.adapter;

    installNativeMultipartAdapter(client);

    expect(client.axiosInstance.defaults.adapter).toBe(defaultAdapter);
  });

  it('keeps a custom default adapter for non-multipart requests', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const customAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'custom',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = customAdapter;
    installNativeMultipartAdapter(client);

    const multipartFormData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await client.axiosInstance.post('/uploads/image', multipartFormData);

    expect(NativeHandlers.multipartUpload).toHaveBeenCalled();
    expect(customAdapter).not.toHaveBeenCalled();
    expect(client.axiosInstance.defaults.adapter).toBe(customAdapter);

    await client.axiosInstance.post('/messages', { text: 'hello' });

    expect(customAdapter).toHaveBeenCalled();
  });

  it('rejects when an interceptor replaces the file body after it was routed natively', async () => {
    const client = getTestClient();
    preserveRequestData(client);

    // Registered before the install, so axios runs it after the install's interceptor.
    client.axiosInstance.interceptors.request.use((config) => {
      config.data = { text: 'no longer a file' };
      return config;
    });
    installNativeMultipartAdapter(client);

    const formData = {
      _parts: [
        [
          'file',
          {
            name: 'test.jpg',
            type: 'image/jpeg',
            uri: 'file:///tmp/test.jpg',
          },
        ],
      ],
    };

    await expect(client.axiosInstance.post('/uploads/image', formData)).rejects.toThrow(
      /request body changed/,
    );
    expect(NativeHandlers.multipartUpload).not.toHaveBeenCalled();
  });

  it('routes a FormData upload natively through axios’ default request transform', async () => {
    // Every other test swaps `transformRequest` for a no-op. This one keeps axios' default, which
    // runs between the install's interceptor (sees the body before it) and the native adapter (sees
    // it after), so the body has to pass through it untouched. axios captures the global FormData
    // when it loads, so it is loaded fresh with React Native's FormData installed globally — as it
    // is in an app — instead of Node's.
    const originalFormData = global.FormData;
    const RNFormData = jest.requireActual('react-native/Libraries/Network/FormData').default;
    global.FormData = RNFormData;

    try {
      let isolated!: {
        getTestClient: typeof getTestClient;
        installNativeMultipartAdapter: typeof installNativeMultipartAdapter;
        NativeHandlers: typeof NativeHandlers;
      };
      jest.isolateModules(() => {
        isolated = {
          getTestClient: require('../../mock-builders/mock').getTestClient,
          installNativeMultipartAdapter: require('../installNativeMultipartAdapter')
            .installNativeMultipartAdapter,
          NativeHandlers: require('../../native').NativeHandlers,
        };
      });
      isolated.NativeHandlers.multipartUpload = NativeHandlers.multipartUpload;

      const client = isolated.getTestClient();
      const defaultAdapter = jest.fn();
      client.axiosInstance.defaults.adapter = defaultAdapter;
      isolated.installNativeMultipartAdapter(client);

      const formData = new RNFormData();
      formData.append('file', {
        name: 'test.jpg',
        type: 'image/jpeg',
        uri: 'file:///tmp/test.jpg',
      });
      formData.append('user', JSON.stringify({ id: 'john' }));

      const response = await client.axiosInstance.postForm('/uploads/image', formData);

      expect(defaultAdapter).not.toHaveBeenCalled();
      expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          parts: [
            {
              fieldName: 'file',
              fileName: 'test.jpg',
              kind: 'file',
              mimeType: 'image/jpeg',
              uri: 'file:///tmp/test.jpg',
            },
            { fieldName: 'user', kind: 'text', value: JSON.stringify({ id: 'john' }) },
          ],
        }),
      );
      expect(response.status).toBe(200);
    } finally {
      global.FormData = originalFormData;
    }
  });

  it('does not install when native multipart upload is unavailable', () => {
    // Nothing registers a native uploader in the test setup.
    NativeHandlers.multipartUpload = originalMultipartUpload;
    expect(isNativeMultipartUploadAvailable()).toBe(false);
    const client = getTestClient();
    const use = jest.spyOn(client.axiosInstance.interceptors.request, 'use');

    installNativeMultipartAdapter(client);

    expect(use).not.toHaveBeenCalled();
  });
});
