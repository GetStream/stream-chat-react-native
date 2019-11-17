export const QueryChannelsSchema = {
  name: 'QueryChannels',
  primaryKey: 'query',
  properties: {
    query: 'string',
    channels: {
      type: 'list',
      objectType: 'Channel',
    },
  },
};

export const ChannelSchema = {
  name: 'Channel',
  primaryKey: 'id',
  properties: {
    type: 'string',
    id: 'string',
    data: 'string',
    cid: 'string',
    members: { type: 'list', objectType: 'Member' },
    messages: { type: 'list', objectType: 'Message' },
    read: { type: 'list', objectType: 'Read' },
    initialized: 'bool',
    // TODO: convert config to different schema
    config: 'ChannelConfig',
  },
};

export const ChannelConfigSchema = {
  name: 'ChannelConfig',
  properties: {
    name: 'string',
    typing_events: 'bool',
    read_events: 'bool',
    connect_events: 'bool',
    reactions: 'bool',
    replies: 'bool',
    search: 'bool',
    mutes: 'bool',
    message_retention: 'string',
    max_message_length: 'int',
    uploads: 'bool',
    automod: 'string',
    automod_behavior: 'string',
    commands: {
      type: 'list',
      objectType: 'Command',
    },
  },
};

export const CommandSchema = {
  name: 'Command',
  primaryKey: 'name',
  properties: {
    name: 'string',
    description: 'string',
    args: 'string',
    set: 'string',
  },
};

export const ReadSchema = {
  name: 'Read',
  primaryKey: 'id',
  properties: {
    id: 'string', // userId + channelId
    lastRead: 'date',
    user: 'User',
  },
};

// TODO: Primary key should be id - channel_id + user_id
export const MemberSchema = {
  name: 'Member',
  primaryKey: 'user_id',
  properties: {
    user_id: 'string',
    user: { type: 'User' },
    is_moderator: { type: 'bool', optional: true },
    invited: { type: 'bool', optional: true },
    invite_accepted_at: { type: 'string', optional: true },
    invite_rejected_at: { type: 'string', optional: true },
    role: { type: 'string', optional: true },
    created_at: { type: 'string', optional: true },
    updated_at: { type: 'string', optional: true },
  },
};

export const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    image: 'string',
    role: 'string',
    created_at: { type: 'string', optional: true },
    updated_at: { type: 'string', optional: true },
    last_active: { type: 'string', optional: true },
    deleted_at: { type: 'string', optional: true },
    deactivated_at: { type: 'string', optional: true },
    online: { type: 'bool', optional: true },
    // TODO: Implement following
    // extraData: { type: 'string', optional: true },
  },
};

export const MessageSchema = {
  name: 'Message',
  primaryKey: 'id',
  properties: {
    id: 'string',
    text: 'string',
    // TODO: Implement the following
    // attachments?: Attachment[],
    parent_id: { type: 'string', optional: true },
    mentioned_users: { type: 'list', objectType: 'User' },
    command: { type: 'string', optional: true },
    user: { type: 'User' },
    html: 'string',
    type: 'string',
    latest_reactions: { type: 'list', objectType: 'Reaction' },
    own_reactions: { type: 'list', objectType: 'Reaction' },
    reaction_counts: { type: 'list', objectType: 'ReactionCount' },
    show_in_channel: { type: 'bool', optional: true },
    reply_count: { type: 'int', optional: true },
    created_at: 'date',
    updated_at: 'date',
    deleted_at: { type: 'date', optional: true },
    channel: {
      type: 'linkingObjects',
      objectType: 'Channel',
      property: 'messages',
    },
  },
};

export const ReactionSchema = {
  name: 'Reaction',
  primaryKey: 'id',
  properties: {
    id: 'string',
    type: 'string',
    user_id: { type: 'string', optional: true },
    user: { type: 'User', optional: true },
    created_at: 'string',
    message: {
      type: 'linkingObjects',
      objectType: 'Message',
      property: 'latest_reactions',
    },
  },
};

export const ReactionCountSchema = {
  name: 'ReactionCount',
  primaryKey: 'id',
  properties: {
    id: 'string',
    type: 'string',
    count: 'int',
  },
};
