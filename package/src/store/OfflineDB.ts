import { AbstractOfflineDB, GetLastSyncedAtType, UpsertUserSyncStatusType } from 'stream-chat';
import type { GetChannelsForQueryType, GetChannelsType } from 'stream-chat';

import * as api from './apis';
import { SqliteClient } from './SqliteClient';

export class OfflineDB extends AbstractOfflineDB {
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

  addPendingTask = api.addPendingTask;

  deletePendingTask = api.deletePendingTask;

  getPendingTasks = api.getPendingTasks;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;
}
