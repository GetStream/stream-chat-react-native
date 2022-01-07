import { mockedApiResponse } from './utils';

/**
 * Returns the api response for queryChannels api
 *
 * api - /channels
 *
 * @param {*} channels Array of channel objects.
 */
export const queryChannelsApi = (channels = []) => {
  const result = {
    channels,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
