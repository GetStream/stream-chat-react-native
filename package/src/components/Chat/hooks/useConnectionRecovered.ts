import { useEffect, useRef, useState } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import { getAllChannelIds } from '../../../store/apis/getAllChannelIds';
import { getLastSyncedAt } from '../../../store/apis/getLastSyncedAt';
import { upsertLastSyncedAt } from '../../../store/apis/upsertLastSyncedAt';
import { QuickSqliteClient } from '../../../store/QuickSqliteClient';
import type { PreparedQueries } from '../../../store/types';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { executePendingTasks } from '../../../utils/pendingTaskUtils';

type Params<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  client: StreamChat<StreamChatGenerics>;
  enableOfflineSupport: boolean;
};

export const useConnectionRecovered = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  enableOfflineSupport,
}: Params<StreamChatGenerics>) => {
  const [connectionRecoveredCallbacks, setConnectionRecoveredCallbacks] = useState<
    Array<() => void>
  >([]);
  const onLoadExecuted = useRef(false);

  const sync = async () => {
    if (!client?.user) return;

    const lastSyncedAt = getLastSyncedAt({
      currentUserId: client.user.id,
    });
    const cids = getAllChannelIds();

    if (lastSyncedAt) {
      try {
        const result = await client.sync(cids, new Date(lastSyncedAt).toISOString());
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
      currentUserId: client.user.id,
      lastSyncedAt: new Date().toString(),
    });
  };

  useEffect(() => {
    const syncAndExecutePendingTasks = async () => {
      onLoadExecuted.current = true;
      await sync();
      await executePendingTasks(client);
      connectionRecoveredCallbacks.forEach((c) => c());
    };

    if (
      client?.wsConnection?.isHealthy &&
      enableOfflineSupport &&
      client.user?.id &&
      connectionRecoveredCallbacks.length > 0 &&
      !onLoadExecuted.current
    ) {
      syncAndExecutePendingTasks();
    }

    let connectionChangedListener: ReturnType<StreamChat['on']>;

    if (client) {
      connectionChangedListener = client.on('connection.changed', (event) => {
        if (event.online && enableOfflineSupport) {
          syncAndExecutePendingTasks();
        }
      });
    }

    return () => {
      connectionChangedListener?.unsubscribe?.();
    };
  }, [client, connectionRecoveredCallbacks.length]);

  return {
    subscribeConnectionRecoveredCallback: (listener: () => void) => {
      setConnectionRecoveredCallbacks((callbacks) => [...callbacks, listener]);

      return () => {
        setConnectionRecoveredCallbacks((callbacks) => callbacks.filter((el) => el !== listener));
      };
    },
  };
};
