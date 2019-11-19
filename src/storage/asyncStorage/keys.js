export const getStreamChatKey = () => `getstream:chat`;
export const getQueryKey = (query) => `${getStreamChatKey()}@query:${query}`;
export const getChannelKey = (channelId) =>
  `${getStreamChatKey()}@channel:${channelId}`;
export const getChannelMessagesKey = (channelId) =>
  `${getChannelKey(channelId)}:messages`;
export const getChannelMembersKey = (channelId) =>
  `${getChannelKey(channelId)}:members`;
export const getChannelReadKey = (channelId) =>
  `${getChannelKey(channelId)}:reads`;
export const getUserKey = (userId) => `${getStreamChatKey()}@user:${userId}`;
export const getChannelConfigKey = (type) =>
  `${getStreamChatKey()}@config:${type}`;
