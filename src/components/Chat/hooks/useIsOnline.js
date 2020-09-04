import { useEffect, useState } from 'react';

import { NetInfo } from '../../../native';

export const useIsOnline = ({
  client,
  setConnectionRecovering,
  setIsOnline,
}) => {
  const [unsubscribeNetInfo, setUnsubscribeNetInfo] = useState(null);

  useEffect(() => {
    const handleChangedEvent = (e) => {
      setConnectionRecovering(!e.online);
      setIsOnline(e.online);
    };

    const handleRecoveredEvent = () => setConnectionRecovering(false);

    const notifyChatClient = (isConnected) => {
      if (client && client.wsConnection) {
        if (isConnected) {
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
      NetInfo.fetch().then((isConnected) => {
        notifyChatClient(isConnected);
      });
      setUnsubscribeNetInfo(
        NetInfo.addEventListener((isConnected) => {
          notifyChatClient(isConnected);
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
};
