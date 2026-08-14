/* eslint no-underscore-dangle: 0 */
import { AxiosError, type AxiosResponse } from 'axios';
import type { StreamChat } from 'stream-chat';

import type { MockedApiResponse } from './utils';

type MockableAxios = StreamChat['axiosInstance'] & {
  __mockedResponsesByMethod?: Record<string, MockedApiResponse['response']>;
};

/**
 * Hook to mock the calls made by the StreamChat client.
 *
 * v10's `ApiClient` routes EVERY request through `axiosInstance.request(config)` — not the
 * per-verb `axiosInstance.post/get/put/delete` methods the pre-v10 harness spied on. So we
 * intercept `request` once and dispatch the queued mock responses by `config.method`.
 *
 * Multiple `useMockedApis` calls accumulate into a per-instance map (last response per method
 * wins, matching the previous per-verb `mockResolvedValue` behavior). The spy is (re)installed
 * whenever `request` isn't currently a mock, so it survives `jest.restoreAllMocks()` between tests.
 *
 * You should provide the responses of the APIs in the order they will be called, built with the
 * api helpers in this directory (e.g. `getOrCreateChannelApi`, `queryChannelsApi`).
 */
export const useMockedApis = (client: StreamChat, apiResponses: MockedApiResponse[]) => {
  const axiosInstance = client.axiosInstance as MockableAxios;

  if (!jest.isMockFunction(axiosInstance.request)) {
    axiosInstance.__mockedResponsesByMethod = {};
    const mockRequest = (config: { method?: string; url?: string } = {}) => {
      const method = String(config.method ?? 'get').toLowerCase();
      const responses = axiosInstance.__mockedResponsesByMethod ?? {};
      if (method in responses) {
        const mocked = responses[method];
        // Mimic axios's default `validateStatus`: a non-2xx response REJECTS with an AxiosError, the
        // shape the LLC's `ApiClient` inspects (`error.response?.data`, `error.status`). Without this
        // a mocked 500 (e.g. `erroredPostApi()`) would resolve as success and never exercise the
        // real request-failure/offline path.
        if (mocked.status >= 400) {
          const response = {
            config,
            data: mocked.data,
            headers: {},
            status: mocked.status,
            statusText: '',
          } as unknown as AxiosResponse;
          const error = new AxiosError(
            (mocked.data as { message?: string })?.message ??
              `Request failed with status code ${mocked.status}`,
            String(mocked.status),
            config as never,
            undefined,
            response,
          );
          (error as { status?: number }).status = mocked.status;
          return Promise.reject(error);
        }
        return Promise.resolve(mocked);
      }
      return Promise.reject(
        new Error(
          `useMockedApis: no mocked response for ${method.toUpperCase()} ${config.url ?? ''}`,
        ),
      );
    };
    jest.spyOn(axiosInstance, 'request').mockImplementation(mockRequest as never);
  }

  const responses = (axiosInstance.__mockedResponsesByMethod ??= {});
  apiResponses.forEach(({ response, type }) => {
    responses[type] = response;
  });
};
