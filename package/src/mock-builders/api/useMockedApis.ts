import type { StreamChat } from 'stream-chat';

import type { MockedApiResponse } from './utils';

/**
 * Hook to mock the calls made through axios module.
 * You should provide the responses of Apis in order that they will be called.
 * You should use api functions from current directory to build these responses.
 * e.g., queryChannelsApi, sendMessageApi
 */
export const useMockedApis = (client: StreamChat, apiResponses: MockedApiResponse[]) => {
  apiResponses.forEach(({ response, type }) => {
    jest.spyOn(client.axiosInstance, type).mockImplementation().mockResolvedValue(response);
  });
};
