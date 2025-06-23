/* eslint-disable @typescript-eslint/no-explicit-any */
import { mockedApiResponse } from './utils';

export type GetOrCreateChannelApiParams = {
  draft?: Record<string, any>;
  channel?: Record<string, any>;
  members?: Record<string, any>[];
  messages?: Record<string, any>[];
  pinnedMessages?: Record<string, any>[];
  read?: Record<string, any>[];
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
    draft: {},
    members: [],
    messages: [],
    pinnedMessages: [],
    read: [],
  },
) => {
  const result = {
    channel: channel.channel,
    draft: channel.draft,
    duration: 0.01,
    members: channel.members,
    messages: channel.messages,
    pinnedMessages: channel.pinnedMessages,
    read: channel.read,
  };

  return mockedApiResponse(result, 'post');
};
