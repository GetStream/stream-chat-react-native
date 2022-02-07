import { useCallback, useEffect, useState } from 'react';

import type { NetInfoSubscription } from '@react-native-community/netinfo';

import type { ExtendableGenerics, StreamChat, Event as StreamEvent } from 'stream-chat';

import { useAppStateListener } from '../../../hooks/useAppStateListener';
import { useIsMountedRef } from '../../../hooks/useIsMountedRef';
import { NetInfo } from '../../../native';

import type { DefaultStreamChatGenerics } from '../../../types/types';

/**
 * Disconnect the websocket connection when app goes to background,
 * and reconnect when app comes to foreground.
 * We do this to make sure, user receives push notifications when app is in the background.
 * You can't receive push notification until you have active websocket connection.
 */
export const useIsOnline = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatClient>,
  closeConnectionOnBackground = true,
) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionRecovering, setConnectionRecovering] = useState(false);
  const isMounted = useIsMountedRef();
  const clientExits = !!client;

  const onBackground = useCallback(() => {
    if (!closeConnectionOnBackground) return;

    for (const cid in client.activeChannels) {
      const channel = client.activeChannels[cid];
      channel?.state.setIsUpToDate(false);
    }

    client.closeConnection();
    setIsOnline(false);
  }, [closeConnectionOnBackground, client]);

  const onForeground = useCallback(() => {
    if (!closeConnectionOnBackground) return;

    client.openConnection();
  }, [closeConnectionOnBackground, client]);

  useAppStateListener(onForeground, onBackground);

  useEffect(() => {
    const handleChangedEvent = (event: StreamEvent<StreamChatClient>) => {
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
  }, [clientExits]);

  return { connectionRecovering, isOnline };
};
