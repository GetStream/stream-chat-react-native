import { useEffect } from 'react';

export const useConnectionRecovered = ({
  client,
  setConnectionRecovering,
  unmounted,
}) => {
  useEffect(() => {
    const handleEvent = () => {
      if (unmounted) return;
      setConnectionRecovering(false);
    };

    if (client) {
      client.on('connection.recovered', handleEvent);
    }
    return () => client.off('connection.recovered', handleEvent);
  }, [client]);
};
