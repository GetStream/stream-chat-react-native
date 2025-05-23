import type { AxiosError } from 'axios';
import dayjs from 'dayjs';
import type { APIErrorResponse, StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from '../components/Chat/hooks/handleEventToSyncDB';
import { getAllChannelIds, getLastSyncedAt, upsertUserSyncStatus } from '../store/apis';

import { addPendingTask } from '../store/apis/addPendingTask';

import { deletePendingTask } from '../store/apis/deletePendingTask';
import { getPendingTasks } from '../store/apis/getPendingTasks';
import { SqliteClient } from '../store/SqliteClient';
import type { PendingTask } from '../store/types';

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
const restBeforeNextTask = () => new Promise((resolve) => setTimeout(resolve, 500));

export class DBSyncManager {
  static syncStatus = false;
  static listeners: Array<(status: boolean) => void> = [];
  static client: StreamChat | null = null;
  static connectionChangedListener: { unsubscribe: () => void } | null = null;

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
    try {
      this.client = client;
      // If the websocket connection is already active, then straightaway
      // call the sync api and also execute pending api calls.
      // Otherwise wait for `connection.changed` event.
      if (client.user?.id && client.wsConnection?.isHealthy) {
        await this.syncAndExecutePendingTasks();
        this.syncStatus = true;
        this.listeners.forEach((l) => l(true));
      }

      // If a listener has already been registered, unsubscribe from it so
      // that it can be reinstated. This can happen if we reconnect with a
      // different user or the component invoking the init() function gets
      // unmounted and then remounted again. This part of the code makes
      // sure the stale listener doesn't produce a memory leak.
      if (this.connectionChangedListener) {
        this.connectionChangedListener.unsubscribe();
      }

      this.connectionChangedListener = this.client.on('connection.changed', async (event) => {
        if (event.online) {
          await this.syncAndExecutePendingTasks();
          this.syncStatus = true;
          this.listeners.forEach((l) => l(true));
        } else {
          this.syncStatus = false;
          this.listeners.forEach((l) => l(false));
        }
      });
    } catch (error) {
      console.log('Error in DBSyncManager.init: ', error);
    }
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

  static sync = async (client: StreamChat) => {
    if (!this.client?.user) {
      return;
    }
    const cids = await getAllChannelIds();
    // If there are no channels, then there is no need to sync.
    if (cids.length === 0) {
      return;
    }

    const lastSyncedAt = await getLastSyncedAt({
      currentUserId: this.client.user.id,
    });

    if (lastSyncedAt) {
      const lastSyncedAtDate = new Date(lastSyncedAt);
      const lastSyncedAtDayJs = dayjs(lastSyncedAtDate);
      const nowDayJs = dayjs();
      const diff = nowDayJs.diff(lastSyncedAtDayJs, 'days');
      if (diff > 30) {
        // stream backend will send an error if we try to sync after 30 days.
        // In that case reset the entire DB and start fresh.
        await SqliteClient.resetDB();
      } else {
        try {
          const result = await this.client.sync(cids, lastSyncedAtDate.toISOString());
          const queryPromises = result.events.map(
            async (event) => await handleEventToSyncDB(event, client),
          );
          const queriesArray = await Promise.all(queryPromises);
          const queries = queriesArray.flat();

          if (queries.length) {
            await SqliteClient.executeSqlBatch(queries);
          }
        } catch (e) {
          // Error will be raised by the sync API if there are too many events.
          // In that case reset the entire DB and start fresh.
          await SqliteClient.resetDB();
        }
      }
    }
    await upsertUserSyncStatus({
      currentUserId: this.client.user.id,
      lastSyncedAt: new Date().toString(),
    });
  };

  static syncAndExecutePendingTasks = async () => {
    if (!this.client) {
      return;
    }

    await this.executePendingTasks(this.client);
    await this.sync(this.client);
  };

  static queueTask = async ({ client, task }: { client: StreamChat; task: PendingTask }) => {
    const removeFromApi = await addPendingTask(task);

    let response;
    try {
      response = await this.executeTask({ client, task });
    } catch (e) {
      if ((e as AxiosError<APIErrorResponse>)?.response?.data?.code === 4) {
        // Error code 16 - message already exists
        // ignore
      } else {
        throw e;
      }
    }

    await removeFromApi();

    return response;
  };

  static executeTask = async ({ client, task }: { client: StreamChat; task: PendingTask }) => {
    const channel = client.channel(task.channelType, task.channelId);

    if (task.type === 'send-reaction') {
      return await channel.sendReaction(...task.payload);
    }

    if (task.type === 'delete-reaction') {
      return await channel.deleteReaction(...task.payload);
    }

    if (task.type === 'delete-message') {
      return await client.deleteMessage(...task.payload);
    }

    throw new Error('Invalid task type');
  };

  static executePendingTasks = async (client: StreamChat) => {
    const queue = await getPendingTasks();
    for (const task of queue) {
      if (!task.id) {
        continue;
      }

      try {
        await this.executeTask({
          client,
          task,
        });
      } catch (e) {
        if ((e as AxiosError<APIErrorResponse>)?.response?.data?.code === 4) {
          // Error code 16 - message already exists
          // ignore
        } else {
          throw e;
        }
      }

      await deletePendingTask({
        id: task.id,
      });
      await restBeforeNextTask();
    }
  };

  static dropPendingTasks = async (conditions: { messageId: string }) => {
    const tasks = await getPendingTasks(conditions);

    for (const task of tasks) {
      if (!task.id) {
        continue;
      }

      await deletePendingTask({
        id: task.id,
      });
    }
  };
}
