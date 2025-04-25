import { AbstractOfflineDB, StreamChat } from 'stream-chat';
import type {
  GetAppSettingsType,
  GetChannelsForQueryType,
  GetChannelsType,
  GetLastSyncedAtType,
  UpsertAppSettingsType,
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
  upsertUserSyncStatus = ({ userId, lastSyncedAt, flush }: UpsertUserSyncStatusType) =>
    api.upsertUserSyncStatus({ currentUserId: userId, flush, lastSyncedAt });

  // FIXME
  upsertAppSettings = ({ appSettings, userId, flush }: UpsertAppSettingsType) =>
    api.upsertAppSettings({ appSettings, currentUserId: userId, flush });

  upsertPoll = api.upsertPoll;

  upsertChannelData = api.upsertChannelData;

  upsertReads = api.upsertReads;

  upsertMessages = api.upsertMessages;

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

  getReactions = api.getReactionsForFilterSort;

  addPendingTask = api.addPendingTask;

  deletePendingTask = api.deletePendingTask;

  deleteReaction = api.deleteReaction;

  hardDeleteMessage = api.deleteMessage;

  softDeleteMessage = api.softDeleteMessage;

  getPendingTasks = api.getPendingTasks;

  updateReaction = api.updateReaction;

  insertReaction = api.insertReaction;

  updateMessage = api.updateMessage;

  channelExists = api.channelExists;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;
}
