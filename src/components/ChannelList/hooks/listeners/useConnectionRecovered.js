import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useConnectionRecovered = ({ setForceUpdate }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = () => {
      setForceUpdate((count) => count + 1);
    };

    client.on('connection.recovered', handleEvent);
    return () => client.off('connection.recovered', handleEvent);
  }, []);
};
