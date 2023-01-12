import type { Channel, StreamChat } from 'stream-chat';

import type { Schema } from './schema';

export type Table = keyof Schema;
export type TableRow<T extends Table> = Schema[T];
export type TableRowJoinedUser<T extends Table> = Schema[T] & {
  user: TableRow<'users'>;
};

export type TableColumnNames<T extends Table> = keyof Schema[T];
export type TableColumnValue = string | boolean | number | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreparedQueries = [string] | [string, Array<any>];

export type PendingTaskTypes = {
  deleteMessage: 'delete-message';
  deleteReaction: 'delete-reaction';
  sendReaction: 'send-reaction';
};

export type PendingTask = {
  channelId: string;
  channelType: string;
  messageId: string;
  id?: number;
} & (
  | {
      payload: Parameters<Channel['sendReaction']>;
      type: PendingTaskTypes['sendReaction'];
    }
  | {
      payload: Parameters<StreamChat['deleteMessage']>;
      type: PendingTaskTypes['deleteMessage'];
    }
  | {
      payload: Parameters<Channel['deleteReaction']>;
      type: PendingTaskTypes['deleteReaction'];
    }
);
