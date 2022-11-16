import { useEffect, useState } from 'react';

import type { Event, EventHandler, StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import { getAllChannelIds } from '../../../store/apis/getAllChannelIds';
import { getLastSyncedAt } from '../../../store/apis/getLastSyncedAt';
import { upsertLastSyncedAt } from '../../../store/apis/upsertLastSyncedAt';
import { QuickSqliteClient } from '../../../store/QuickSqliteClient';
import type { PreparedQueries } from '../../../store/types';
import type { DefaultStreamChatGenerics } from '../../../types/types';

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
    EventHandler<StreamChatGenerics>[]
  >([]);

  useEffect(() => {
    const sync = async () => {
      if (!client?.user) return;

      const lastSyncedAt = getLastSyncedAt({
        currentUserId: client.user.id,
      });
      const cids = getAllChannelIds();

      if (lastSyncedAt && cids?.length) {
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
          // do nothing
          QuickSqliteClient.resetDB();
        }
      }
      upsertLastSyncedAt({
        currentUserId: client.user.id,
        lastSyncedAt: new Date().toString(),
      });
    };

    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (enableOfflineSupport) {
        await sync();
      }

      connectionRecoveredCallbacks.forEach((c) => c(event));
    };

    let connectionChangedListener: ReturnType<StreamChat['on']>;

    if (client) {
      connectionChangedListener = client.on('connection.changed', (event) => {
        if (event.online) {
          handleEvent(event);
        }
      });
    }

    return () => {
      connectionChangedListener?.unsubscribe?.();
    };
  }, [client, connectionRecoveredCallbacks.length]);

  return {
    subscribeConnectionRecoveredCallback: (listener: EventHandler<StreamChatGenerics>) => {
      setConnectionRecoveredCallbacks((callbacks) => [...callbacks, listener]);

      return () => {
        setConnectionRecoveredCallbacks((callbacks) => callbacks.filter((el) => el !== listener));
      };
    },
  };
};
