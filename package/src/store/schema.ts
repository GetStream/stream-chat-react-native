import type { MessageLabel, Role } from 'stream-chat';

type Tables = {
  [P in keyof Schema]: {
    columns: {
      [K in keyof Schema[P]]: string;
    };
    primaryKey: Array<keyof Schema[P]>;
    foreignKeys?: Array<{
      column: `${Exclude<keyof Schema[P], symbol>}`;
      referenceTable: `${keyof Schema}`;
      referenceTableColumn: string;
      // https://www.sqlite.org/foreignkeys.html#fk_actions
      onDeleteAction?: 'NO ACTION' | 'RESTRICT' | 'SET NULL' | 'SET DEFAULT' | 'CASCADE';
    }>;
    indexes?: Array<{
      columns: Array<keyof Schema[P]>;
      name: string;
      unique: boolean;
    }>;
  };
};

export const tables: Tables = {
  channels: {
    columns: {
      cid: 'TEXT',
      createdAt: "TEXT DEFAULT ''",
      extraData: "TEXT DEFAULT ''",
      id: 'TEXT',
      pinnedMessages: "TEXT DEFAULT ''",
      updatedAt: "TEXT DEFAULT ''",
    },
    primaryKey: ['cid'],
  },
  members: {
    columns: {
      banned: 'INTEGER DEFAULT 0',
      channelRole: 'TEXT NOT NULL',
      cid: 'TEXT NOT NULL',
      createdAt: 'TEXT',
      inviteAcceptedAt: 'TEXT',
      invited: 'INTEGER',
      inviteRejectedAt: 'TEXT',
      isModerator: 'INTEGER',
      role: 'TEXT',
      shadowBanned: 'INTEGER',
      updatedAt: 'TEXT',
      userId: 'TEXT',
    },
    foreignKeys: [
      {
        column: 'cid',
        onDeleteAction: 'CASCADE',
        referenceTable: 'channels',
        referenceTableColumn: 'cid',
      },
    ],
    indexes: [
      {
        columns: ['cid', 'userId'],
        name: 'index_members',
        unique: false,
      },
    ],
    primaryKey: ['cid', 'userId'],
  },
  messages: {
    columns: {
      attachments: "TEXT DEFAULT ''",
      cid: 'TEXT NOT NULL',
      createdAt: "TEXT DEFAULT ''",
      deletedAt: "TEXT DEFAULT ''",
      extraData: "TEXT DEFAULT ''",
      id: 'TEXT',
      reactionCounts: "TEXT DEFAULT ''",
      text: "TEXT DEFAULT ''",
      type: "TEXT DEFAULT ''",
      updatedAt: "TEXT DEFAULT ''",
      userId: "TEXT DEFAULT ''",
    },
    indexes: [
      {
        columns: ['cid', 'userId'],
        name: 'index_messages',
        unique: false,
      },
    ],
    primaryKey: ['id'],
  },
  queryChannelsMap: {
    columns: {
      cids: 'TEXT',
      id: 'TEXT',
      lastSyncedAt: 'TEXT',
    },
    primaryKey: ['id'],
  },
  reactions: {
    columns: {
      createdAt: "TEXT DEFAULT ''",
      extraData: "TEXT DEFAULT ''",
      messageId: "TEXT DEFAULT ''",
      score: 'INTEGER DEFAULT 0',
      type: "TEXT DEFAULT ''",
      updatedAt: "TEXT DEFAULT ''",
      userId: "TEXT DEFAULT ''",
    },
    foreignKeys: [
      {
        column: 'messageId',
        onDeleteAction: 'CASCADE',
        referenceTable: 'messages',
        referenceTableColumn: 'id',
      },
    ],
    indexes: [
      {
        columns: ['messageId', 'userId'],
        name: 'index_reaction',
        unique: false,
      },
    ],
    primaryKey: ['messageId', 'userId', 'type'],
  },
  reads: {
    columns: {
      cid: 'TEXT NOT NULL',
      lastRead: 'TEXT NOT NULL',
      unreadMessages: 'INTEGER DEFAULT 0',
      userId: 'TEXT',
    },
    indexes: [
      {
        columns: ['cid', 'userId'],
        name: 'index_reads_cid',
        unique: false,
      },
    ],
    primaryKey: ['userId', 'cid'],
  },
  users: {
    columns: {
      banned: 'INTEGER DEFAULT 0',
      createdAt: 'TEXT',
      extraData: 'TEXT',
      id: 'TEXT',
      lastActive: 'TEXT',
      online: 'INTEGER',
      role: 'TEXT',
      updatedAt: 'TEXT',
    },
    indexes: [
      {
        columns: ['id'],
        name: 'index_users_id',
        unique: true,
      },
    ],
    primaryKey: ['id'],
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
    messageId: string;
    type: string;
    updatedAt: string;
    extraData?: string;
    score?: number;
    userId?: string;
  };
  reads: {
    cid: string;
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
