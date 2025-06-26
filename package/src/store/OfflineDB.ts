import { AbstractOfflineDB, StreamChat } from 'stream-chat';
import type {
  DBGetAppSettingsType,
  DBGetChannelsForQueryType,
  DBGetChannelsType,
  DBGetLastSyncedAtType,
  DBUpsertAppSettingsType,
  DBUpsertUserSyncStatusType,
} from 'stream-chat';

import * as api from './apis';
import { SqliteClient } from './SqliteClient';

export class OfflineDB extends AbstractOfflineDB {
  constructor({ client }: { client: StreamChat }) {
    super({ client });
  }

  upsertCidsForQuery = api.upsertCidsForQuery;

  upsertChannels = api.upsertChannels;

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  upsertUserSyncStatus = ({ userId, lastSyncedAt, execute }: DBUpsertUserSyncStatusType) =>
    api.upsertUserSyncStatus({ currentUserId: userId, execute, lastSyncedAt });

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  upsertAppSettings = ({ appSettings, userId, execute }: DBUpsertAppSettingsType) =>
    api.upsertAppSettings({ appSettings, currentUserId: userId, execute });

  upsertPoll = api.upsertPoll;

  upsertDraft = api.upsertDraft;

  getDraft = api.getDraft;

  deleteDraft = api.deleteDraft;

  upsertChannelData = api.upsertChannelData;

  upsertReads = api.upsertReads;

  upsertMessages = api.upsertMessages;

  upsertMembers = api.upsertMembers;

  updateMessage = api.updateMessage;

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  getChannels = ({ cids, userId }: DBGetChannelsType) =>
    api.getChannels({ channelIds: cids, currentUserId: userId });

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  getChannelsForQuery = ({ userId, filters, sort }: DBGetChannelsForQueryType) =>
    api.getChannelsForFilterSort({ currentUserId: userId, filters, sort });

  getAllChannelCids = api.getAllChannelIds;

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  getLastSyncedAt = ({ userId }: DBGetLastSyncedAtType) =>
    api.getLastSyncedAt({ currentUserId: userId });

  getAppSettings = ({ userId }: DBGetAppSettingsType) =>
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
