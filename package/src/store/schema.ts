import type { MessageLabel, PendingTaskTypes, Role } from 'stream-chat';

import type { ValueOf } from '../types/types';

type Tables = {
  [P in keyof Schema]: {
    columns: {
      [K in keyof Schema[P]]: string;
    };
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
    primaryKey?: Array<keyof Schema[P]>;
  };
};

export const tables: Tables = {
  channelQueries: {
    columns: {
      cids: 'TEXT',
      id: 'TEXT',
    },
    primaryKey: ['id'],
  },
  channels: {
    columns: {
      autoTranslationEnabled: 'BOOLEAN',
      autoTranslationLanguage: 'TEXT',
      cid: 'TEXT',
      config: 'TEXT',
      cooldown: 'BOOLEAN',
      createdAt: 'TEXT',
      createdById: 'TEXT',
      deletedAt: 'TEXT',
      disabled: 'BOOLEAN DEFAULT FALSE',
      extraData: 'TEXT',
      frozen: 'BOOLEAN',
      hidden: 'BOOLEAN',
      id: 'TEXT',
      invites: 'TEXT',
      lastMessageAt: 'TEXT',
      memberCount: 'INTEGER',
      muted: 'BOOLEAN DEFAULT FALSE',
      ownCapabilities: 'TEXT',
      team: 'TEXT',
      truncatedAt: 'TEXT',
      truncatedBy: 'TEXT',
      truncatedById: 'TEXT',
      type: 'TEXT',
      updatedAt: 'TEXT',
    },
    primaryKey: ['cid'],
  },
  draft: {
    columns: {
      cid: 'TEXT NOT NULL',
      createdAt: 'TEXT',
      draftMessageId: 'TEXT NOT NULL',
      parentId: 'TEXT',
      quotedMessageId: 'TEXT',
    },
    foreignKeys: [
      {
        column: 'draftMessageId',
        onDeleteAction: 'CASCADE',
        referenceTable: 'draftMessage',
        referenceTableColumn: 'id',
      },
    ],
    indexes: [
      {
        columns: ['cid', 'draftMessageId'],
        name: 'index_draft',
        unique: false,
      },
    ],
    primaryKey: ['cid', 'draftMessageId'],
  },
  draftMessage: {
    columns: {
      attachments: 'TEXT',
      custom: 'TEXT',
      id: 'TEXT NOT NULL',
      mentionedUsers: 'TEXT',
      parentId: 'TEXT',
      poll_id: 'TEXT',
      quotedMessageId: 'TEXT',
      showInChannel: 'BOOLEAN DEFAULT FALSE',
      silent: 'BOOLEAN DEFAULT FALSE',
      text: 'TEXT',
      type: 'TEXT',
    },
    primaryKey: ['id'],
  },
  members: {
    columns: {
      archivedAt: 'TEXT',
      banned: 'BOOLEAN DEFAULT FALSE',
      channelRole: 'TEXT',
      cid: 'TEXT NOT NULL',
      createdAt: 'TEXT',
      inviteAcceptedAt: 'TEXT',
      invited: 'BOOLEAN',
      inviteRejectedAt: 'TEXT',
      isModerator: 'BOOLEAN',
      pinnedAt: 'TEXT',
      role: 'TEXT',
      shadowBanned: 'BOOLEAN DEFAULT FALSE',
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
      attachments: 'TEXT',
      cid: 'TEXT NOT NULL',
      createdAt: 'TEXT',
      deletedAt: 'TEXT',
      extraData: 'TEXT',
      id: 'TEXT',
      messageTextUpdatedAt: 'TEXT',
      poll_id: 'TEXT',
      reactionGroups: 'TEXT',
      text: "TEXT DEFAULT ''",
      type: 'TEXT',
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
        name: 'index_messages',
        unique: false,
      },
    ],
    primaryKey: ['id'],
  },
  pendingTasks: {
    columns: {
      channelId: 'TEXT',
      channelType: 'TEXT',
      createdAt: 'TEXT',
      id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      messageId: 'TEXT',
      payload: 'TEXT',
      threadId: 'TEXT',
      type: 'TEXT',
    },
  },
  poll: {
    columns: {
      allow_answers: 'BOOLEAN DEFAULT FALSE',
      allow_user_suggested_options: 'BOOLEAN DEFAULT FALSE',
      answers_count: 'INTEGER DEFAULT 0',
      created_at: 'TEXT',
      created_by: 'TEXT',
      created_by_id: 'TEXT',
      description: 'TEXT',
      enforce_unique_vote: 'BOOLEAN DEFAULT FALSE',
      id: 'TEXT NOT NULL',
      is_closed: 'BOOLEAN DEFAULT FALSE',
      latest_answers: 'TEXT',
      latest_votes_by_option: 'TEXT',
      max_votes_allowed: 'INTEGER DEFAULT 1',
      name: 'TEXT',
      options: 'TEXT',
      own_votes: 'TEXT',
      updated_at: 'TEXT',
      vote_count: 'INTEGER DEFAULT 0',
      vote_counts_by_option: 'TEXT',
      voting_visibility: 'TEXT',
    },
    primaryKey: ['id'],
  },
  reactions: {
    columns: {
      createdAt: 'TEXT',
      extraData: 'TEXT',
      messageId: 'TEXT',
      score: 'INTEGER DEFAULT 0',
      type: 'TEXT',
      updatedAt: 'TEXT',
      userId: 'TEXT',
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
      lastReadMessageId: 'TEXT',
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
      banned: 'BOOLEAN DEFAULT FALSE',
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
  userSyncStatus: {
    columns: {
      appSettings: 'TEXT',
      lastSyncedAt: 'TEXT',
      userId: 'TEXT',
    },
    primaryKey: ['userId'],
  },
};

// TODO: Checking the optionality of columns
export type Schema = {
  channelQueries: {
    cids: string;
    id: string;
  };
  channels: {
    cid: string;
    extraData: string;
    id: string;
    type: string;
    autoTranslationEnabled?: boolean;
    autoTranslationLanguage?: string;
    config?: string;
    cooldown?: number;
    createdAt?: string;
    createdById?: string;
    deletedAt?: string;
    disabled?: boolean;
    frozen?: boolean;
    hidden?: boolean;
    invites?: string;
    lastMessageAt?: string;
    memberCount?: number;
    muted?: boolean;
    ownCapabilities?: string;
    team?: string;
    truncatedAt?: string;
    truncatedBy?: string;
    truncatedById?: string;
    updatedAt?: string;
  };
  draft: {
    draftMessageId: string;
    cid: string;
    createdAt: string;
    parentId?: string;
    quotedMessageId?: string;
  };
  draftMessage: {
    id: string;
    attachments?: string;
    custom?: string;
    mentionedUsers?: string;
    parentId?: string;
    poll_id?: string;
    quotedMessageId?: string;
    showInChannel?: boolean;
    silent?: boolean;
    text: string;
    type?: MessageLabel;
  };
  members: {
    archivedAt?: string;
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
    pinnedAt?: string;
  };
  messages: {
    attachments: string;
    cid: string;
    createdAt: string;
    deletedAt: string;
    extraData: string;
    id: string;
    messageTextUpdatedAt: string;
    poll_id: string;
    reactionGroups: string;
    type: MessageLabel;
    updatedAt: string;
    text?: string;
    userId?: string;
  };
  pendingTasks: {
    channelId: string;
    channelType: string;
    createdAt: string;
    id: number;
    messageId: string;
    threadId: string;
    payload: string;
    type: ValueOf<PendingTaskTypes>;
  };
  poll: {
    answers_count: number;
    created_at: string;
    created_by: string;
    created_by_id: string;
    enforce_unique_vote: boolean;
    id: string;
    latest_answers: string;
    latest_votes_by_option: string;
    max_votes_allowed: number;
    name: string;
    options: string;
    updated_at: string;
    vote_count: number;
    vote_counts_by_option: string;
    allow_answers?: boolean;
    allow_user_suggested_options?: boolean;
    description?: string;
    is_closed?: boolean;
    own_votes?: string;
    voting_visibility?: string;
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
    lastReadMessageId?: string;
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
  userSyncStatus: {
    appSettings: string;
    lastSyncedAt: string;
    userId: string;
  };
};
