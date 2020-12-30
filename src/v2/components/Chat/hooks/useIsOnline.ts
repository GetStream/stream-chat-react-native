import { useEffect, useState } from 'react';

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
) => {
  const [
    unsubscribeNetInfo,
    setUnsubscribeNetInfo,
  ] = useState<NetInfoSubscription>();
  const [isOnline, setIsOnline] = useState(true);
  const [connectionRecovering, setConnectionRecovering] = useState(false);

  const clientExits = !!client;
  useEffect(() => {
    const handleChangedEvent = (
      event: StreamEvent<At, Ch, Co, Ev, Me, Re, Us>,
    ) => {
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
