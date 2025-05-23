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
  upsertUserSyncStatus = ({ userId, lastSyncedAt, execute }: UpsertUserSyncStatusType) =>
    api.upsertUserSyncStatus({ currentUserId: userId, execute, lastSyncedAt });

  // FIXME
  upsertAppSettings = ({ appSettings, userId, execute }: UpsertAppSettingsType) =>
    api.upsertAppSettings({ appSettings, currentUserId: userId, execute });

  upsertPoll = api.upsertPoll;

  upsertChannelData = api.upsertChannelData;

  upsertReads = api.upsertReads;

  upsertMessages = api.upsertMessages;

  upsertMembers = api.upsertMembers;

  updateMessage = api.updateMessage;

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

  deleteMember = api.deleteMember;

  deleteChannel = api.deleteChannel;

  deleteMessagesForChannel = api.deleteMessagesForChannel;

  dropPendingTasks = api.dropPendingTasks;

  hardDeleteMessage = api.deleteMessage;

  softDeleteMessage = api.softDeleteMessage;

  getPendingTasks = api.getPendingTasks;

  updateReaction = api.updateReaction;

  insertReaction = api.insertReaction;

  channelExists = api.channelExists;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;

  initializeDB = SqliteClient.initializeDatabase;
}
