import { useEffect, useRef } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { getAllChannelIds } from '../../../../store/apis/getAllChannelIds';
import { getLastSyncedAt } from '../../../../store/apis/getLastSyncedAt';
import { upsertLastSyncedAt } from '../../../../store/apis/upsertLastSyncedAt';
import { QuickSqliteClient } from '../../../../store/QuickSqliteClient';
import type { PreparedQueries } from '../../../../store/types';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Params = {
  enableOfflineSupport: boolean;
  refreshList: () => void;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useConnectionRecovered = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  enableOfflineSupport,
  refreshList,
  setForceUpdate,
}: Params) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const refRefreshList = useRef(refreshList);
  refRefreshList.current = refreshList;

  useEffect(() => {
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
          // do nothing
          QuickSqliteClient.resetDB();
        }
      }
      upsertLastSyncedAt({
        currentUserId: client.user.id,
        lastSyncedAt: new Date().toString(),
      });
    };

    const handleEvent = async () => {
      await sync();
      refRefreshList.current();
      setForceUpdate((count) => count + 1);
    };

    let connectionRecoveredListener: ReturnType<StreamChat['on']>;
    let connectionChangedListener: ReturnType<StreamChat['on']>;

    if (client && enableOfflineSupport) {
      connectionRecoveredListener = client.on('connection.recovered', handleEvent);
      connectionChangedListener = client.on('connection.changed', (event) => {
        if (event.online) {
          handleEvent();
        }
      });
    }

    return () => {
      connectionRecoveredListener?.unsubscribe?.();
      connectionChangedListener?.unsubscribe?.();
    };
  }, [client]);
};
