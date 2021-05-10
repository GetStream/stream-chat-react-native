import { useEffect, useRef, useState } from 'react';

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
import { AppState, AppStateStatus } from 'react-native';

export const useIsOnline = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  closeConnectionOnBackground = true,
) => {
  const [
    unsubscribeNetInfo,
    setUnsubscribeNetInfo,
  ] = useState<NetInfoSubscription>();
  const [isOnline, setIsOnline] = useState(true);
  const [connectionRecovering, setConnectionRecovering] = useState(false);

  const clientExits = !!client;
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    closeConnectionOnBackground &&
      AppState.addEventListener('change', handleAppStateChange);

    return () => {
      closeConnectionOnBackground &&
        AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [closeConnectionOnBackground]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current === 'background' && nextAppState === 'active') {
      setTimeout(async () => {
        await client.openConnection();
      }, 3000);
    } else if (
      appState.current.match(/active|inactive/) &&
      nextAppState === 'background'
    ) {
      await client.closeConnection();
      setIsOnline(false);

      for (const cid in client.activeChannels) {
        const channel = client.activeChannels[cid];
        channel.state.setIsUpToDate(false);
      }
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    const handleChangedEvent = (
      event: StreamEvent<At, Ch, Co, Ev, Me, Re, Us>,
    ) => {
      setConnectionRecovering(!event.online);
      console.log('setting ', event.online);
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
      });
      setUnsubscribeNetInfo(
        NetInfo.addEventListener((netInfoState) => {
          notifyChatClient(netInfoState);
        }),
      );
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
