import { mockedApiResponse } from './utils.js';

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
    messages: [],
    members: [],
  },
) => {
  const result = {
    channel: channel.channel,
    messages: channel.messages,
    members: channel.members,
    duration: 0.01,
  };

  return mockedApiResponse(result, 'post');
};
