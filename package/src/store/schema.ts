import type { MessageLabel, Role } from 'stream-chat';

/* eslint-disable sort-keys */
export const schema: {
  [P in keyof Schema]: {
    [K in keyof Schema[P]]: string;
  };
} = {
  queryChannelsMap: {
    lastSyncedAt: 'TEXT',
    id: 'TEXT PRIMARY KEY',
    cids: 'TEXT',
  },
  channels: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    pinnedMessages: "TEXT DEFAULT ''",
    extraData: "TEXT DEFAULT ''",
    createdAt: "TEXT DEFAULT ''",
    updatedAt: "TEXT DEFAULT ''",
  },
  members: {
    cid: 'TEXT NOT NULL',
    id: 'TEXT PRIMARY KEY',
    banned: 'INTEGER DEFAULT 0',
    channelRole: 'TEXT NOT NULL',
    createdAt: 'TEXT',
    inviteAcceptedAt: 'TEXT',
    inviteRejectedAt: 'TEXT',
    invited: 'INTEGER',
    isModerator: 'INTEGER',
    role: 'TEXT',
    shadowBanned: 'INTEGER',
    updatedAt: 'TEXT',
    userId: 'TEXT',
  },
  messages: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    deletedAt: "TEXT DEFAULT ''",
    reactionCounts: "TEXT DEFAULT ''",
    text: "TEXT DEFAULT ''",
    type: "TEXT DEFAULT ''",
    userId: "TEXT DEFAULT ''",
    attachments: "TEXT DEFAULT ''",
    createdAt: "TEXT DEFAULT ''",
    updatedAt: "TEXT DEFAULT ''",
    extraData: "TEXT DEFAULT ''",
  },
  reactions: {
    id: 'TEXT PRIMARY KEY',
    createdAt: "TEXT DEFAULT ''",
    updatedAt: "TEXT DEFAULT ''",
    extraData: "TEXT DEFAULT ''",
    messageId: "TEXT DEFAULT ''",
    score: 'INTEGER DEFAULT 0',
    userId: "TEXT DEFAULT ''",
    type: "TEXT DEFAULT ''",
  },
  reads: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    lastRead: 'TEXT NOT NULL',
    unreadMessages: 'INTEGER DEFAULT 0',
    userId: 'TEXT',
  },
  users: {
    banned: 'INTEGER DEFAULT 0',
    createdAt: 'TEXT',
    extraData: 'TEXT',
    id: 'TEXT PRIMARY KEY',
    lastActive: 'TEXT',
    online: 'INTEGER',
    role: 'TEXT',
    updatedAt: 'TEXT',
  },
};

// TODO: Checking the optionality of columns
export type Schema = {
  channels: {
    cid: string;
    extraData: string;
    id: string;
    pinnedMessages: string;
    createdAt?: string;
    updatedAt?: string;
  };
  members: {
    cid: string;
    id: string;
    banned?: boolean;
    channelRole?: Role;
    createdAt?: string;
    inviteAcceptedAt?: string;
    invited?: boolean;
    inviteRejectedAt?: string;
    isModerator?: boolean;
    role?: string;
    shadowBanned?: boolean;
    updatedAt?: string;
    userId?: string;
  };
  messages: {
    attachments: string;
    cid: string;
    createdAt: string;
    deletedAt: string;
    extraData: string;
    id: string;
    reactionCounts: string;
    type: MessageLabel;
    updatedAt: string;
    text?: string;
    userId?: string;
  };
  queryChannelsMap: {
    cids: string;
    id: string;
    lastSyncedAt: string;
  };
  reactions: {
    createdAt: string;
    id: string;
    messageId: string;
    type: string;
    updatedAt: string;
    extraData?: string;
    score?: number;
    userId?: string;
  };
  reads: {
    cid: string;
    id: string;
    lastRead: string;
    unreadMessages?: number;
    userId?: string;
  };
  users: {
    id: string;
    banned?: boolean;
    createdAt?: string;
    extraData?: string;
    lastActive?: string;
    online?: boolean;
    role?: string;
    updatedAt?: string;
  };
};
