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
import { SqliteClient, SqliteClientError } from './SqliteClient';

export class OfflineDB extends AbstractOfflineDB {
  constructor({
    client,
    getEncryptionKey,
    maxSyncEventsLimit,
  }: {
    client: StreamChat;
    /**
     * Supplies the SQLCipher key the offline database is opened with. See
     * {@link SqliteClient.getEncryptionKey} for the stability requirement.
     */
    getEncryptionKey?: () => Promise<string | undefined>;
    maxSyncEventsLimit?: number | false;
  }) {
    super({
      client,
      syncMaxEventCount: maxSyncEventsLimit === false ? undefined : maxSyncEventsLimit,
    });
    // Assigned unconditionally: SqliteClient holds this statically, so leaving a
    // previous instance's getter in place would keep encrypting after the caller
    // stopped asking for it.
    SqliteClient.getEncryptionKey = getEncryptionKey;
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
  getChannelsForQuery = ({ userId, options }: DBGetChannelsForQueryType) =>
    api.getChannelsForFilterSort({
      currentUserId: userId,
      filters: options?.filter_conditions,
      options,
      sort: options?.sort,
    });

  getAllChannelCids = api.getAllChannelIds;

  // TODO: Rename currentUserId -> userId in the next major version as it is technically breaking.
  getLastSyncedAt = ({ userId }: DBGetLastSyncedAtType) =>
    api.getLastSyncedAt({ currentUserId: userId });

  getAppSettings = ({ userId }: DBGetAppSettingsType) =>
    api.getAppSettings({ currentUserId: userId });

  getReactions = api.getReactionsForFilterSort;

  addPendingTask = api.addPendingTask;

  updatePendingTask = api.updatePendingTask;

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

  /**
   * Why the most recent {@link initializeDB} failed, if it did.
   *
   * `AbstractOfflineDB.init` catches whatever `initializeDB` throws and does not
   * re-throw it, so a caller has no way to see the reason. Recording it here on the
   * way out gives the caller something to read back once `init` has settled. Kept on
   * the instance rather than a static so two clients cannot overwrite each other.
   */
  initializationError: SqliteClientError | undefined;

  initializeDB = async () => {
    this.initializationError = undefined;
    try {
      return await SqliteClient.initializeDatabase();
    } catch (error) {
      if (error instanceof SqliteClientError) {
        this.initializationError = error;
      }
      // Re-thrown so `AbstractOfflineDB.init` still marks the database uninitialized.
      throw error;
    }
  };
}
