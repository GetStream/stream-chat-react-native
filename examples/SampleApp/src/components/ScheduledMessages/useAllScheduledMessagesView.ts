import { useEffect, useMemo } from 'react';

import { ScheduledMessagePaginator, ScheduledMessagesView } from 'stream-chat';
import { useChatContext } from 'stream-chat-react-native';

/**
 * Every scheduled message of the user, across channels. Its paginator is registered with the
 * client while mounted, so the list follows the scheduled message events.
 */
export const useAllScheduledMessagesView = () => {
  const { client } = useChatContext();
  const view = useMemo(
    () => new ScheduledMessagesView({ paginator: new ScheduledMessagePaginator({ client }) }),
    [client],
  );

  useEffect(() => {
    const manager = client.scheduledMessagePaginators;
    manager.insertPaginator({ paginator: view.paginator });
    return () => {
      manager.removePaginator(view.paginator);
    };
  }, [client, view]);

  return view;
};
