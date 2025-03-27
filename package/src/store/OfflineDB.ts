import {
  AbstractOfflineDB,
  GetAppSettingsType,
  StreamChat,
  UpsertAppSettingsType,
} from 'stream-chat';
import type {
  GetChannelsForQueryType,
  GetChannelsType,
  GetLastSyncedAtType,
  UpsertUserSyncStatusType,
} from 'stream-chat';

import * as api from './apis';
import { SqliteClient } from './SqliteClient';

export class OfflineDB extends AbstractOfflineDB {
  constructor({ client }: { client: StreamChat }) {
    super({ client });
  }

  upsertCidsForQuery = api.upsertCidsForQuery;

  upsertChannels = api.upsertChannels;

  // FIXME
  upsertUserSyncStatus = ({ userId, lastSyncedAt }: UpsertUserSyncStatusType) =>
    api.upsertUserSyncStatus({ currentUserId: userId, lastSyncedAt });

  // FIXME
  upsertAppSettings = ({ appSettings, userId, flush }: UpsertAppSettingsType) =>
    api.upsertAppSettings({ appSettings, currentUserId: userId, flush });

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

  getAppSettings = ({ userId }: GetAppSettingsType) =>
    api.getAppSettings({ currentUserId: userId });

  addPendingTask = api.addPendingTask;

  deletePendingTask = api.deletePendingTask;

  deleteReaction = api.deleteReaction;

  hardDeleteMessage = api.deleteMessage;

  softDeleteMessage = api.softDeleteMessage;

  getPendingTasks = api.getPendingTasks;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;
}
