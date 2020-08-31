export const QueryChannelsSchema = {
  name: 'QueryChannels',
  primaryKey: 'query',
  properties: {
    channels: {
      objectType: 'Channel',
      type: 'list',
    },
    query: 'string',
  },
};

export const ChannelSchema = {
  name: 'Channel',
  primaryKey: 'id',
  properties: {
    cid: 'string',
    config: 'ChannelConfig',
    created_at: { indexed: true, optional: true, type: 'string' },
    data: 'string',
    id: 'string',
    initialized: 'bool',
    last_message_at: { indexed: true, optional: true, type: 'date' },
    members: { objectType: 'Member', type: 'list' },
    messages: { objectType: 'Message', type: 'list' },
    read: { objectType: 'Read', type: 'list' },
    type: 'string',
    updated_at: { indexed: true, optional: true, type: 'string' },
  },
};

export const ChannelConfigSchema = {
  name: 'ChannelConfig',
  primaryKey: 'type',
  properties: {
    automod: 'string',
    automod_behavior: 'string',
    commands: {
      objectType: 'Command',
      type: 'list',
    },
    connect_events: 'bool',
    max_message_length: 'int',
    message_retention: 'string',
    mutes: 'bool',
    name: 'string',
    reactions: 'bool',
    read_events: 'bool',
    replies: 'bool',
    search: 'bool',
    type: 'string',
    typing_events: 'bool',
    uploads: 'bool',
  },
};

export const CommandSchema = {
  name: 'Command',
  primaryKey: 'name',
  properties: {
    args: 'string',
    description: 'string',
    name: 'string',
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

export const MemberSchema = {
  name: 'Member',
  primaryKey: 'id',
  properties: {
    created_at: { optional: true, type: 'string' },
    id: 'string',
    invite_accepted_at: { optional: true, type: 'string' },
    invite_rejected_at: { optional: true, type: 'string' },
    invited: { optional: true, type: 'bool' },
    is_moderator: { optional: true, type: 'bool' },
    role: { optional: true, type: 'string' },
    updated_at: { optional: true, type: 'string' },
    user: { type: 'User' },
    user_id: 'string',
  },
};

export const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    created_at: { optional: true, type: 'string' },
    deactivated_at: { optional: true, type: 'string' },
    deleted_at: { optional: true, type: 'string' },
    extraData: { optional: true, type: 'string' },
    id: 'string',
    image: { optional: true, type: 'string' },
    last_active: { optional: true, type: 'string' },
    name: { optional: true, type: 'string' },
    online: { optional: true, type: 'bool' },
    role: { optional: true, type: 'string' },
    updated_at: { optional: true, type: 'string' },
  },
};

export const MessageSchema = {
  name: 'Message',
  primaryKey: 'id',
  properties: {
    attachments: 'Attachment[]',
    command: { optional: true, type: 'string' },
    created_at: { indexed: true, type: 'date' },
    deleted_at: { optional: true, type: 'date' },
    extraData: { optional: true, type: 'string' },
    html: 'string',
    id: 'string',
    latest_reactions: { objectType: 'Reaction', type: 'list' },
    mentioned_users: { objectType: 'User', type: 'list' },
    own_reactions: { objectType: 'Reaction', type: 'list' },
    parent_id: { optional: true, type: 'string' },
    reaction_counts: { objectType: 'ReactionCount', type: 'list' },
    reply_count: { optional: true, type: 'int' },
    show_in_channel: { optional: true, type: 'bool' },
    status: 'string',
    text: 'string',
    type: 'string',
    updated_at: { optional: true, type: 'date' },
    user: { optional: true, type: 'User' },
  },
};

export const AttachmentSchema = {
  name: 'Attachment',
  properties: {
    actions: { optional: true, type: 'string' },
    author_icon: { optional: true, type: 'string' },
    author_link: { optional: true, type: 'string' },
    autor_name: { optional: true, type: 'string' },
    fallback: { optional: true, type: 'string' },
    footer: { optional: true, type: 'string' },
    footer_icon: { optional: true, type: 'string' },
    image_url: { optional: true, type: 'string' },
    og_scrape_url: { optional: true, type: 'string' },
    pretext: { optional: true, type: 'string' },
    text: { optional: true, type: 'string' },
    thumb_url: { optional: true, type: 'string' },
    title: { optional: true, type: 'string' },
    title_link: { optional: true, type: 'string' },
    type: { optional: true, type: 'string' },
  },
};

export const ReactionSchema = {
  name: 'Reaction',
  primaryKey: 'id',
  properties: {
    created_at: 'string',
    id: 'string', // message_id + user_id + reaction_type
    message_id: 'string',
    type: 'string',
    user: { optional: true, type: 'User' },
    user_id: { optional: true, type: 'string' },
  },
};

export const ReactionCountSchema = {
  name: 'ReactionCount',
  primaryKey: 'id',
  properties: {
    count: 'int',
    id: 'string',
    type: 'string',
  },
};
