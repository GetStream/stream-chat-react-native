import { useCallback, useEffect, useState } from 'react';

import type { NetInfoSubscription } from '@react-native-community/netinfo';

import type { StreamChat, Event as StreamEvent } from 'stream-chat';

import { useAppStateListener } from '../../../hooks/useAppStateListener';
import { useIsMountedRef } from '../../../hooks/useIsMountedRef';
import { NetInfo } from '../../../native';

import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Disconnect the websocket connection when app goes to background,
 * and reconnect when app comes to foreground.
 * We do this to make sure the user receives push notifications when app is in the background.
 * You can't receive push notification until you have active websocket connection.
 */
export const useIsOnline = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  closeConnectionOnBackground = true,
) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [connectionRecovering, setConnectionRecovering] = useState(false);
  const isMounted = useIsMountedRef();
  const clientExists = !!client;

  const onBackground = useCallback(() => {
    if (!closeConnectionOnBackground || !clientExists) return;

    for (const cid in client.activeChannels) {
      const channel = client.activeChannels[cid];
      channel?.state.setIsUpToDate(false);
    }

    client.closeConnection();
    setIsOnline(false);
  }, [closeConnectionOnBackground, client, clientExists]);

  const onForeground = useCallback(() => {
    // If the user id is not set, we should not open the connection, as it will raise an unneeded error
    if (!clientExists || !client.userID) return;

    client.openConnection();
  }, [client, clientExists]);

  useAppStateListener(onForeground, onBackground);

  useEffect(() => {
    const handleChangedEvent = (event: StreamEvent<StreamChatGenerics>) => {
      setConnectionRecovering(!event.online);
      setIsOnline(event.online || false);
    };

    const handleRecoveredEvent = () => setConnectionRecovering(false);

    const notifyChatClient = (netInfoState: boolean) => {
      if (client?.wsConnection) {
        if (netInfoState) {
          client.wsConnection.onlineStatusChanged({
            type: 'online',
          } as Event);
        } else {
          client.wsConnection.onlineStatusChanged({
            type: 'offline',
          } as Event);
        }
      }
    };

    let unsubscribeNetInfo: NetInfoSubscription;
    const setNetInfoListener = () => {
      unsubscribeNetInfo = NetInfo.addEventListener((netInfoState) => {
        if (netInfoState === false && !client.wsConnection?.isHealthy) {
          setConnectionRecovering(true);
          setIsOnline(false);
        }
        notifyChatClient(netInfoState);
      });
    };

    const setInitialOnlineState = async () => {
      const status = await NetInfo.fetch();
      if (isMounted.current) {
        setIsOnline(status);
        notifyChatClient(status);
      }
    };

    setInitialOnlineState();
    const chatListeners: Array<ReturnType<StreamChat['on']>> = [];

    if (client) {
      chatListeners.push(client.on('connection.changed', handleChangedEvent));
      chatListeners.push(client.on('connection.recovered', handleRecoveredEvent));
      setNetInfoListener();
    }

    return () => {
      chatListeners.forEach((listener) => listener.unsubscribe?.());
      unsubscribeNetInfo?.();
    };
  }, [clientExists]);

  return { connectionRecovering, isOnline };
};
