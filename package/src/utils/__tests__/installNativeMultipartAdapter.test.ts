import { getTestClient } from '../../mock-builders/mock';
import { NativeHandlers } from '../../native';
import {
  installNativeMultipartAdapter,
  wrapAxiosAdapterWithNativeMultipart,
} from '../installNativeMultipartAdapter';

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
    });

    expect(defaultAdapter).not.toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'token',
          'Content-Type': 'multipart/form-data',
          'X-Stream-Client': 'stream-test',
        }),
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

    await client.axiosInstance.post('/uploads/image', formData, {
      onUploadProgress,
      uploadProgressOptions: {
        count: 10,
        intervalMs: 25,
      },
      uploadProgress,
    });

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

    await client.axiosInstance.post('/uploads/image', formData, {
      onUploadProgress,
      uploadProgressOptions: {
        completionProgressCap: 75,
        count: 10,
        intervalMs: 25,
      },
    });

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

    const interceptorId = client.axiosInstance.interceptors.request.use((config) => ({
      ...config,
      headers: {
        ...config.headers,
        'X-CDN-Route': 'custom-cdn',
      },
      url: '/uploads/file',
    }));

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
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    installNativeMultipartAdapter(client);
    const installedAdapter = client.axiosInstance.defaults.adapter;
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

    expect(client.axiosInstance.defaults.adapter).toBe(installedAdapter);
    expect(defaultAdapter).not.toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).toHaveBeenCalled();
  });

  it('composes explicitly with a custom adapter', async () => {
    const client = getTestClient();
    preserveRequestData(client);
    const customAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'custom',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = wrapAxiosAdapterWithNativeMultipart(
      client,
      customAdapter,
    );

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

    await client.axiosInstance.post('/messages', { text: 'hello' });

    expect(customAdapter).toHaveBeenCalled();
  });
});
