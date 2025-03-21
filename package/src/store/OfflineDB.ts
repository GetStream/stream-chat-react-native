import {
  AbstractOfflineDB,
  GetLastSyncedAtType,
  type ReactionResponse,
  StreamChat,
  UpsertUserSyncStatusType,
} from 'stream-chat';
import type { GetChannelsForQueryType, GetChannelsType, UpsertReactionType } from 'stream-chat';

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

  upsertReaction = async ({
    channel,
    enforceUniqueReaction,
    messageId,
    reactionType,
    user,
  }: UpsertReactionType) => {
    const message = channel.state.messages.find(({ id }) => id === messageId);

    if (!message) {
      return;
    }

    const hasOwnReaction = message.own_reactions && message.own_reactions.length > 0;

    const reaction: ReactionResponse = {
      created_at: new Date().toISOString(),
      message_id: messageId,
      type: reactionType,
      updated_at: new Date().toISOString(),
      user,
      user_id: user?.id,
    };

    if (enforceUniqueReaction && hasOwnReaction) {
      await api.updateReaction({
        message,
        reaction,
      });
    } else {
      await api.insertReaction({
        message,
        reaction,
      });
    }
  };

  addPendingTask = api.addPendingTask;

  deletePendingTask = api.deletePendingTask;

  getPendingTasks = api.getPendingTasks;

  resetDB = SqliteClient.resetDB;

  executeSqlBatch = SqliteClient.executeSqlBatch;
}
