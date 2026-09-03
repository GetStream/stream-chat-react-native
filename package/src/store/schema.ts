import type { MessageLabel, PendingTaskTypes } from 'stream-chat';

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
      createdAt: 'INTEGER',
      createdById: 'TEXT',
      deletedAt: 'INTEGER',
      disabled: 'BOOLEAN DEFAULT FALSE',
      extraData: 'TEXT',
      frozen: 'BOOLEAN',
      hidden: 'BOOLEAN',
      id: 'TEXT',
      invites: 'TEXT',
      lastMessageAt: 'INTEGER',
      memberCount: 'INTEGER',
      muted: 'BOOLEAN DEFAULT FALSE',
      ownCapabilities: 'TEXT',
      team: 'TEXT',
      truncatedAt: 'INTEGER',
      truncatedBy: 'TEXT',
      truncatedById: 'TEXT',
      type: 'TEXT',
      updatedAt: 'INTEGER',
    },
    primaryKey: ['cid'],
  },
  draft: {
    columns: {
      cid: 'TEXT NOT NULL',
      createdAt: 'INTEGER',
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
      mentionedChannel: 'BOOLEAN DEFAULT FALSE',
      mentionedGroupIds: 'TEXT',
      mentionedHere: 'BOOLEAN DEFAULT FALSE',
      mentionedRoles: 'TEXT',
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
  locations: {
    columns: {
      channelCid: 'TEXT NOT NULL',
      createdAt: 'INTEGER',
      createdByDeviceId: 'TEXT',
      endAt: 'INTEGER',
      latitude: 'REAL NOT NULL',
      longitude: 'REAL NOT NULL',
      messageId: 'TEXT NOT NULL',
      updatedAt: 'INTEGER',
      userId: 'TEXT NOT NULL',
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
        columns: ['channelCid', 'messageId'],
        name: 'index_locations',
        unique: false,
      },
    ],
    primaryKey: ['channelCid', 'messageId'],
  },
  members: {
    columns: {
      archivedAt: 'INTEGER',
      banned: 'BOOLEAN DEFAULT FALSE',
      channelRole: 'TEXT',
      cid: 'TEXT NOT NULL',
      createdAt: 'INTEGER',
      inviteAcceptedAt: 'INTEGER',
      invited: 'BOOLEAN',
      inviteRejectedAt: 'INTEGER',
      isModerator: 'BOOLEAN',
      pinnedAt: 'INTEGER',
      role: 'TEXT',
      shadowBanned: 'BOOLEAN DEFAULT FALSE',
      updatedAt: 'INTEGER',
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
      createdAt: 'INTEGER',
      deletedAt: 'INTEGER',
      deletedForMe: 'BOOLEAN DEFAULT FALSE',
      extraData: 'TEXT',
      id: 'TEXT',
      messageTextUpdatedAt: 'INTEGER',
      poll_id: 'TEXT',
      reactionGroups: 'TEXT',
      shared_location: 'TEXT',
      text: "TEXT DEFAULT ''",
      type: 'TEXT',
      updatedAt: 'INTEGER',
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
      created_at: 'INTEGER',
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
      updated_at: 'INTEGER',
      vote_count: 'INTEGER DEFAULT 0',
      vote_counts_by_option: 'TEXT',
      voting_visibility: 'TEXT',
    },
    primaryKey: ['id'],
  },
  reactions: {
    columns: {
      createdAt: 'INTEGER',
      extraData: 'TEXT',
      messageId: 'TEXT',
      score: 'INTEGER DEFAULT 0',
      type: 'TEXT',
      updatedAt: 'INTEGER',
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
      lastDeliveredAt: 'INTEGER',
      lastDeliveredMessageId: 'TEXT',
      lastRead: 'INTEGER NOT NULL DEFAULT 0',
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
  reminders: {
    columns: {
      channelCid: 'TEXT NOT NULL',
      createdAt: 'INTEGER',
      messageId: 'TEXT NOT NULL',
      remindAt: 'INTEGER',
      updatedAt: 'INTEGER',
      userId: 'TEXT NOT NULL',
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
        columns: ['messageId'],
        name: 'index_reminders',
        unique: false,
      },
    ],
    primaryKey: ['messageId'],
  },
  users: {
    columns: {
      banned: 'BOOLEAN DEFAULT FALSE',
      createdAt: 'INTEGER',
      extraData: 'TEXT',
      id: 'TEXT',
      lastActive: 'INTEGER',
      online: 'INTEGER',
      role: 'TEXT',
      updatedAt: 'INTEGER',
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
    createdAt?: number | null;
    createdById?: string;
    deletedAt?: number | null;
    disabled?: boolean;
    frozen?: boolean;
    hidden?: boolean;
    invites?: string;
    lastMessageAt?: number | null;
    memberCount?: number;
    muted?: boolean;
    ownCapabilities?: string;
    team?: string;
    truncatedAt?: number | null;
    truncatedBy?: string;
    truncatedById?: string;
    updatedAt?: number | null;
  };
  draft: {
    draftMessageId: string;
    cid: string;
    createdAt: number | null;
    parentId?: string;
    quotedMessageId?: string;
  };
  draftMessage: {
    id: string;
    attachments?: string;
    custom?: string;
    mentionedChannel?: boolean;
    mentionedGroupIds?: string;
    mentionedHere?: boolean;
    mentionedRoles?: string;
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
    archivedAt?: number | null;
    cid: string;
    banned?: boolean;
    channelRole?: string;
    createdAt?: number | null;
    inviteAcceptedAt?: number | null;
    invited?: boolean;
    inviteRejectedAt?: number | null;
    isModerator?: boolean;
    role?: string;
    shadowBanned?: boolean;
    updatedAt?: number | null;
    userId?: string;
    pinnedAt?: number | null;
  };
  messages: {
    attachments: string;
    cid: string;
    createdAt: number | null;
    deletedAt: number | null;
    deletedForMe?: boolean;
    extraData: string;
    id: string;
    messageTextUpdatedAt: number | null;
    poll_id: string;
    reactionGroups: string;
    shared_location: string;
    type: MessageLabel;
    updatedAt: number | null;
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
    created_at: number | null;
    created_by: string;
    created_by_id: string;
    enforce_unique_vote: boolean;
    id: string;
    latest_answers: string;
    latest_votes_by_option: string;
    max_votes_allowed: number;
    name: string;
    options: string;
    updated_at: number | null;
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
    createdAt: number | null;
    messageId: string;
    type: string;
    updatedAt: number | null;
    extraData?: string;
    score?: number;
    userId?: string;
  };
  reads: {
    cid: string;
    lastRead: number;
    lastReadMessageId?: string;
    unreadMessages?: number;
    userId?: string;
    lastDeliveredAt?: number | null;
    lastDeliveredMessageId?: string;
  };
  reminders: {
    channelCid: string;
    createdAt: number | null;
    messageId: string;
    updatedAt: number | null;
    userId: string;
    remindAt?: number | null;
  };
  locations: {
    channelCid: string;
    createdAt: number | null;
    createdByDeviceId: string;
    endAt?: number | null;
    latitude: number;
    longitude: number;
    messageId: string;
    updatedAt: number | null;
    userId: string;
  };
  users: {
    id: string;
    banned?: boolean;
    createdAt?: number | null;
    extraData?: string;
    lastActive?: number | null;
    online?: boolean;
    role?: string;
    updatedAt?: number | null;
  };
  userSyncStatus: {
    appSettings: string;
    lastSyncedAt: string;
    userId: string;
  };
};
