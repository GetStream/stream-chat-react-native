import { useEffect, useState } from 'react';

import { useAppStateListener } from '../../../hooks/useAppStateListener';
import { NetInfo } from '../../../native';

import type { NetInfoSubscription } from '@react-native-community/netinfo';
import type { StreamChat, Event as StreamEvent } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

/**
 * Disconnect the websocket connection when app goes to background,
 * and reconnect when app comes to foreground.
 * We do this to make sure, user receives push notifications when app is in the background.
 * You can't receive push notification until you have active websocket connection.
 */
export const useIsOnline = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  closeConnectionOnBackground = true,
) => {
  const [unsubscribeNetInfo, setUnsubscribeNetInfo] = useState<NetInfoSubscription>();
  const [isOnline, setIsOnline] = useState(true);
  const [connectionRecovering, setConnectionRecovering] = useState(false);

  const clientExits = !!client;

  const onBackground = closeConnectionOnBackground
    ? () => {
        for (const cid in client.activeChannels) {
          const channel = client.activeChannels[cid];
          channel?.state.setIsUpToDate(false);
        }
        client.closeConnection();
        setIsOnline(false);
      }
    : undefined;

  const onForeground = closeConnectionOnBackground
    ? () => {
        client.openConnection();
      }
    : undefined;

  useAppStateListener(onForeground, onBackground);

  useEffect(() => {
    const handleChangedEvent = (event: StreamEvent<At, Ch, Co, Ev, Me, Re, Us>) => {
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

    const setConnectionListener = () => {
      NetInfo.fetch().then((netInfoState) => {
        notifyChatClient(netInfoState);
        setUnsubscribeNetInfo(() =>
          NetInfo.addEventListener((netInfoState) => {
            if (netInfoState === false && !client.wsConnection?.isHealthy) {
              setConnectionRecovering(true);
              setIsOnline(false);
            }
            notifyChatClient(netInfoState);
          }),
        );
      });
    };

    const setInitialOnlineState = async () => {
      const status = await NetInfo.fetch();
      setIsOnline(status);
    };

    setInitialOnlineState();
    if (client) {
      client.on('connection.changed', handleChangedEvent);
      client.on('connection.recovered', handleRecoveredEvent);
      setConnectionListener();
    }

    return () => {
      client.off('connection.changed', handleChangedEvent);
      client.off('connection.recovered', handleRecoveredEvent);
      if (unsubscribeNetInfo) {
        unsubscribeNetInfo();
      }
    };
  }, [clientExits]);

  return { connectionRecovering, isOnline };
};
