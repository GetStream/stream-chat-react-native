import type { MessageLabel } from 'stream-chat';

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
    members: "TEXT DEFAULT ''",
    pinnedMessages: "TEXT DEFAULT ''",
    extraData: "TEXT DEFAULT ''",
    createdAt: "TEXT DEFAULT ''",
    updatedAt: "TEXT DEFAULT ''",
  },
  messages: {
    id: 'TEXT PRIMARY KEY',
    cid: 'TEXT NOT NULL',
    deletedAt: "TEXT DEFAULT ''",
    text: "TEXT DEFAULT ''",
    type: "TEXT DEFAULT ''",
    user: "TEXT DEFAULT ''",
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
    user: "TEXT DEFAULT ''",
    type: "TEXT DEFAULT ''",
  },
};

export type Schema = {
  channels: {
    cid: string;
    extraData: string;
    id: string;
    members: string;
    pinnedMessages: string;
    createdAt?: string;
    updatedAt?: string;
  };
  messages: {
    attachments: string;
    cid: string;
    createdAt: string;
    deletedAt: string;
    extraData: string;
    id: string;
    type: MessageLabel;
    updatedAt: string;
    user: string;
    text?: string;
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
    user: string;
    extraData?: string;
    score?: number;
  };
};
