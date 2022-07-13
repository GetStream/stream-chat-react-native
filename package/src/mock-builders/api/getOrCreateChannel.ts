/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockedApiResponse } from './utils';

export type GetOrCreateChannelApiParams = {
  channel?: Record<string, any>;
  members?: Record<string, any>[];
  messages?: Record<string, any>[];
};

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
 *
 * @param {*} channel
 */
export const getOrCreateChannelApi = (
  channel: GetOrCreateChannelApiParams = {
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
