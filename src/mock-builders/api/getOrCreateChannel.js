import { mockedApiResponse } from './utils';

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
 *
 * @param {*} channel
 */
export const getOrCreateChannelApi = (
  channel = {
    channel: {},
    members: [],
    messages: [],
  },
) => {
  const result = {
    channel: channel.channel,
    duration: 0.01,
    members: channel.members,
    messages: channel.messages,
  };

  return mockedApiResponse(result, 'post');
};
