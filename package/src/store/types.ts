import type { Schema } from './schema';

export type Table = keyof Schema;

export type TableColumns<T extends Table> = keyof Partial<Schema[T]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreparedQueries = [string] | [string, Array<any>];

export type ChannelRow = Schema['channels'];
export type MessageRow = Schema['messages'];
export type ChannelQueriesRow = Schema['channelQueries'];
export type ReactionRow = Schema['reactions'];
export type ReadRow = Schema['reads'];
export type MemberRow = Schema['members'];

export type JoinedChannelRow = Schema['channels'] & {
  user: UserRow;
};
export type JoinedMessageRow = Schema['messages'] & {
  user: UserRow;
};
export type JoinedChannelQueriesRow = Schema['channelQueries'] & {
  user: UserRow;
};
export type JoinedReactionRow = Schema['reactions'] & {
  user: UserRow;
};
export type JoinedReadRow = Schema['reads'] & {
  user: UserRow;
};
export type JoinedMemberRow = Schema['members'] & {
  user: UserRow;
};

export type UserRow = Schema['users'];

export type StorableDatabaseRow = Partial<
  ChannelRow | MessageRow | ChannelQueriesRow | ReactionRow
>;
