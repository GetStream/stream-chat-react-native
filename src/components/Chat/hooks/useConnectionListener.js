import { useEffect, useState } from 'react';

import { NetInfo } from '../../../native';

export const useConnectionListener = ({ client }) => {
  const [unsubscribeNetInfo, setUnsubscribeNetInfo] = useState(() => null);

  const notifyChatClient = (isConnected) => {
    if (client?.wsConnection) {
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

  useEffect(() => {
    if (client) {
      setConnectionListener();
    }
    return () => unsubscribeNetInfo?.();
  }, [client]);
};
