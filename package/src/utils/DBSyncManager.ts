import type { StreamChat } from 'stream-chat';

import { executePendingTasks } from './pendingTaskUtils';

import { handleEventToSyncDB } from '../components/Chat/hooks/handleEventToSyncDB';
import { getAllChannelIds, getLastSyncedAt, upsertLastSyncedAt } from '../store/apis';
import { QuickSqliteClient } from '../store/QuickSqliteClient';

import type { PreparedQueries } from '../store/types';

/**
 * DBSyncManager has the responsibility to sync the channel states
 * within local database whenever possible.
 *
 * Components can get the current sync status using DBSyncManager.getCurrentStatus().
 * Or components can attach a listener for status change as following:
 *
 * ```tsx
 * useEffect(() => {
 *  const unsubscribe = DBSyncManager.onSyncStatusChange((syncStatus) => {
 *    if (syncStatus) {
 *      doSomething();
 *    }
 *  })
 *
 *  return () => unsubscribe();
 * })
 * ```
 */
export class DBSyncManager {
  static syncStatus = false;
  static listeners: Array<(status: boolean) => void> = [];
  static client: StreamChat | null = null;

  /**
   * Returns weather channel states in local DB are synced with backend or not.
   * @returns boolean
   */
  static getSyncStatus = () => this.syncStatus;

  /**
   * Initializes the DBSyncManager. This function should be called only once
   * throughout the lifetime of SDK.
   *
   * @param client
   */
  static init = async (client: StreamChat) => {
    this.client = client;
    // If the websocket connection is already active, then straightaway
    // call the sync api and also execute pending api calls.
    // Otherwise wait for `connection.changed` event.
    if (client.user?.id && client.wsConnection?.isHealthy) {
      await this.syncAndExecutePendingTasks();
      this.syncStatus = true;
      this.listeners.forEach((l) => l(true));
    }

    this.client.on('connection.changed', async (event) => {
      if (event.online) {
        await this.syncAndExecutePendingTasks();
        this.listeners.forEach((l) => l(true));
      } else {
        this.listeners.forEach((l) => l(false));
      }
    });
  };

  /**
   * Subscribes a listener for sync status change.
   *
   * @param listener {function}
   * @returns {function} to unsubscribe the listener.
   */
  static onSyncStatusChange = (listener: (status: boolean) => void) => {
    this.listeners.push(listener);

    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter((el) => el !== listener);
      },
    };
  };

  static sync = async () => {
    if (!this.client?.user) return;

    const lastSyncedAt = getLastSyncedAt({
      currentUserId: this.client.user.id,
    });
    const cids = getAllChannelIds();

    if (lastSyncedAt) {
      try {
        const result = await this.client.sync(cids, new Date(lastSyncedAt).toISOString());
        const queries = result.events.reduce<PreparedQueries[]>((queries, event) => {
          queries = queries.concat(handleEventToSyncDB(event, false));
          return queries;
        }, []);

        if (queries.length) {
          QuickSqliteClient.executeSqlBatch(queries);
        }
      } catch (e) {
        // Error will be raised by the sync API if there are too many events.
        // In that case reset the entire DB and start fresh.
        QuickSqliteClient.resetDB();
      }
    }
    upsertLastSyncedAt({
      currentUserId: this.client.user.id,
      lastSyncedAt: new Date().toString(),
    });
  };

  static syncAndExecutePendingTasks = async () => {
    if (!this.client) return;

    await executePendingTasks(this.client);
    await this.sync();
  };
}
