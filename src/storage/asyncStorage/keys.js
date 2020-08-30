export const getStreamChatKey = (appUserId) => `getstream:chat:${appUserId}`;

// List of channel ids for stringified_query
export const getQueryKey = (appUserId, query) =>
  `${getStreamChatKey(appUserId)}@query:${query}`;

// Channel object with id - channelId
export const getChannelKey = (appUserId, channelId) =>
  `${getStreamChatKey(appUserId)}@channel:${channelId}`;

// Messages for channel with id - channelId
export const getChannelMessagesKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:messages`;

// Members for channel with id - channelId
export const getChannelMembersKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:members`;

// Read states for channel with id - channelId
export const getChannelReadKey = (appUserId, channelId) =>
  `${getChannelKey(appUserId, channelId)}:reads`;

// User object for user with id - userId
export const getUserKey = (appUserId, userId) =>
  `${getStreamChatKey(appUserId)}@user:${userId}`;

// Channel config of channel type - type
export const getChannelConfigKey = (appUserId, type) =>
  `${getStreamChatKey(appUserId)}@config:${type}`;
