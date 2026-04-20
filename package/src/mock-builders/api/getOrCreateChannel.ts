import type {
  ChannelMemberResponse,
  ChannelResponse,
  DraftResponse,
  MessageResponse,
  ReadResponse,
} from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

export type GetOrCreateChannelApiParams = {
  draft?: Partial<DraftResponse>;
  channel?: Partial<ChannelResponse>;
  members?: Partial<ChannelMemberResponse>[];
  messages?: Partial<MessageResponse>[];
  pinnedMessages?: Partial<MessageResponse>[];
  read?: Partial<ReadResponse>[];
};

/**
 * Returns the api response for queryChannel api.
 *
 * api - /channels/{type}/{id}/query
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
): MockedApiResponse => {
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
