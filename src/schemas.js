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
    latestMessage: { type: 'Message' },
    initialized: 'bool',
    countUnread: 'int',
    // TODO: convert config to different schema
    config: 'string',
  },
};

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
    role: 'string',
    created_at: { type: 'string', optional: true },
    updated_at: { type: 'string', optional: true },
    last_active: { type: 'string', optional: true },
    deleted_at: { type: 'string', optional: true },
    deactivated_at: { type: 'string', optional: true },
    online: { type: 'bool', optional: true },
  },
};

export const MessageSchema = {
  name: 'Message',
  primaryKey: 'id',
  properties: {
    id: 'string',
    text: 'string',
    // attachments?: Attachment[],
    parent_id: { type: 'string', optional: true },
    mentioned_users: { type: 'list', objectType: 'User' },
    command: { type: 'string', optional: true },
    user: { type: 'User' },
    html: 'string',
    type: 'string',
    latest_reactions: { type: 'list', objectType: 'Reaction' },
    own_reactions: { type: 'list', objectType: 'Reaction' },
    reaction_counts: {
      type: 'list',
      objectType: 'ReactionCount',
    },
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
    // message_id: 'string',
    user_id: { type: 'string', optional: true },
    user: { type: 'User' },
    created_at: 'string',
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
