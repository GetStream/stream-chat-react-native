export const getStreamChatKey = (appUserId) => `getstream:chat:${appUserId}`;
export const getQueryKey = (appUserId, query) =>
  `${getStreamChatKey(appUserId)}@query:${query}`;
export const getChannelKey = (appUserId, channelId) =>
  `${getStreamChatKey(appUserId)}@channel:${channelId}`;
export const getChannelMessagesKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:messages`;
export const getChannelMembersKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:members`;
export const getChannelReadKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:reads`;
export const getUserKey = (appUserId, userId) =>
  `${getStreamChatKey(appUserId)}@user:${userId}`;
export const getChannelConfigKey = (appUserId, type) =>
  `${getStreamChatKey(appUserId)}@config:${type}`;
