import type { Schema, schema } from './schema';

export type Table = keyof typeof schema;

export type PreparedQueries = [string] | [string, Array<any> | Array<Array<any>>];

export type ChannelRow = Schema['channels'];
export type MessageRow = Schema['messages'];
export type QueryChannelsMapRow = Schema['queryChannelsMap'];
export type ReactionRow = Schema['reactions'];
export type ReadRow = Schema['reads'];
export type MemberRow = Schema['members'];

export type JoinedChannelRow = Schema['channels'] & {
  user: UserRow;
};
export type JoinedMessageRow = Schema['messages'] & {
  user: UserRow;
};
export type JoinedQueryChannelsMapRow = Schema['queryChannelsMap'] & {
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
  ChannelRow | MessageRow | QueryChannelsMapRow | ReactionRow
>;
