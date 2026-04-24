import type {
  ChannelMemberResponse,
  ChannelResponse,
  DraftResponse,
  LocalMessage,
  MessageResponse,
  ReadResponse,
} from 'stream-chat';

import { mockedApiResponse, type MockedApiResponse } from './utils';

// Mock message input is either a `MessageResponse` (server shape) or a
// `LocalMessage` (client shape — what `generateMessage` produces). The
// downstream stream-chat client formats these interchangeably.
type MockMessage = Partial<MessageResponse> | LocalMessage;

export type GetOrCreateChannelApiParams = {
  draft?: Partial<DraftResponse>;
  channel?: Partial<ChannelResponse>;
  members?: Partial<ChannelMemberResponse>[];
  messages?: MockMessage[];
  pinnedMessages?: MockMessage[];
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
