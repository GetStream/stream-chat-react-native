import { useEffect } from 'react';

export const useConnectionChanged = ({
  client,
  setConnectionRecovering,
  setIsOnline,
  unmounted,
}) => {
  useEffect(() => {
    const handleEvent = (e) => {
      if (unmounted) return;
      setConnectionRecovering(!e.online);
      setIsOnline(e.online);
    };

    if (client) {
      client.on('connection.changed', handleEvent);
    }
    return () => client.off('connection.changed', handleEvent);
  }, [client]);
};
