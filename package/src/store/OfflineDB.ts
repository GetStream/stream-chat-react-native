import { AbstractOfflineDB, StreamChat } from 'stream-chat';
import type {
  GetChannelsForQueryType,
  GetChannelsType,
  GetLastSyncedAtType,
  UpsertReactionType,
  UpsertUserSyncStatusType,
} from 'stream-chat';

import * as api from './apis';
import { SqliteClient } from './SqliteClient';

export class OfflineDB extends AbstractOfflineDB {
  public initialized = false;

  constructor({ client }: { client: StreamChat }) {
    super({ client });

    this.initialized = true;
  }

  upsertCidsForQuery = api.upsertCidsForQuery;
  upsertChannels = api.upsertChannels;
  // FIXME
  getChannels = ({ cids, userId }: GetChannelsType) =>
    api.getChannels({ channelIds: cids, currentUserId: userId });
  // FIXME
  getChannelsForQuery = ({ userId, filters, sort }: GetChannelsForQueryType) =>
    api.getChannelsForFilterSort({ currentUserId: userId, filters, sort });

  getAllChannelCids = api.getAllChannelIds;
  // FIXME
  getLastSyncedAt = ({ userId }: GetLastSyncedAtType) =>
    api.getLastSyncedAt({ currentUserId: userId });
  // FIXME
  upsertUserSyncStatus = ({ userId, lastSyncedAt }: UpsertUserSyncStatusType) =>
    api.upsertUserSyncStatus({ currentUserId: userId, lastSyncedAt });

  /* eslint-disable @typescript-eslint/no-unused-vars */
  // @ts-expect-error Not yet impelmented
  upsertReaction = async (options: UpsertReactionType) => {};
  /* eslint-enable */

  addPendingTask = api.addPendingTask;

  deletePendingTask = api.deletePendingTask;

  deleteReaction = api.deleteReaction;

  getPendingTasks = api.getPendingTasks;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;
}
