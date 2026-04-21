import { getTestClient } from '../../mock-builders/mock';
import { NativeHandlers } from '../../native';
import { installNativeMultipartInterceptor } from '../installNativeMultipartInterceptor';

describe('installNativeMultipartInterceptor', () => {
  const originalMultipartUpload = NativeHandlers.multipartUpload;

  beforeEach(() => {
    NativeHandlers.multipartUpload = jest.fn().mockResolvedValue({
      body: JSON.stringify({ file: 'https://example.com/file.jpg' }),
      headers: { 'content-type': 'application/json' },
      status: 200,
      statusText: 'OK',
    });
  });

  afterEach(() => {
    NativeHandlers.multipartUpload = originalMultipartUpload;
    jest.clearAllMocks();
  });

  it('routes multipart requests through the native handler', async () => {
    const client = getTestClient();
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    const dispose = installNativeMultipartInterceptor(client);
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

    dispose();
  });

  it('leaves non-multipart requests on the default adapter', async () => {
    const client = getTestClient();
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    const dispose = installNativeMultipartInterceptor(client);

    await client.axiosInstance.post('/messages', { text: 'hello' });

    expect(defaultAdapter).toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).not.toHaveBeenCalled();

    dispose();
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
    const dispose = installNativeMultipartInterceptor(client);
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

    dispose();
  });

  it('removes the interceptor on dispose', async () => {
    const client = getTestClient();
    const defaultAdapter = jest.fn().mockResolvedValue({
      config: {},
      data: 'default',
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    client.axiosInstance.defaults.adapter = defaultAdapter;

    const dispose = installNativeMultipartInterceptor(client);

    dispose();

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

    expect(defaultAdapter).toHaveBeenCalled();
    expect(NativeHandlers.multipartUpload).not.toHaveBeenCalled();
  });
});
