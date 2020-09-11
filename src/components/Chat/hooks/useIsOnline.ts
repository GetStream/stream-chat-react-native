import { useEffect, useState } from 'react';
import type {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/NetInfo';
import type {
  Event,
  LiteralStringForUnion,
  StreamChat,
  UnknownType,
} from 'stream-chat';

import { NetInfo } from '../../../native';

export const useIsOnline = <
  ChannelType extends UnknownType = UnknownType,
  UserType extends UnknownType = UnknownType,
  MessageType extends UnknownType = UnknownType,
  AttachmentType extends UnknownType = UnknownType,
  ReactionType extends UnknownType = UnknownType,
  EventType extends UnknownType = UnknownType,
  CommandType extends string = LiteralStringForUnion
>({
  client,
}: {
  client: StreamChat<
    ChannelType,
    UserType,
    MessageType,
    AttachmentType,
    ReactionType,
    EventType,
    CommandType
  >;
}) => {
  const [unsubscribeNetInfo, setUnsubscribeNetInfo] = useState<
    NetInfoSubscription
  >();
  const [isOnline, setIsOnline] = useState(true);
  const [connectionRecovering, setConnectionRecovering] = useState(false);

  useEffect(() => {
    const handleChangedEvent = (
      e: Event<
        EventType,
        AttachmentType,
        ChannelType,
        MessageType,
        ReactionType,
        UserType,
        CommandType
      >,
    ) => {
      setConnectionRecovering(!e.online);
      setIsOnline(e.online || false);
    };

    const handleRecoveredEvent = () => setConnectionRecovering(false);

    const notifyChatClient = (netInfoState: NetInfoState) => {
      if (client && client.wsConnection) {
        if (netInfoState?.isConnected) {
          client.wsConnection.onlineStatusChanged({
            type: 'online',
          });
        } else {
          client.wsConnection.onlineStatusChanged({
            type: 'offline',
          });
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
  }, [client]);

  return { connectionRecovering, isOnline };
};
