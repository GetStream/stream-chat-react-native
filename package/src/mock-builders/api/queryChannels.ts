import { mockedApiResponse, type MockedApiResponse } from './utils';

/**
 * Returns the api response for queryChannels api
 *
 * api - /channels
 */
export const queryChannelsApi = (channels: unknown[] = []): MockedApiResponse => {
  const result = {
    channels,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
