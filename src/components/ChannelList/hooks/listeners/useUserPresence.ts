import { useContext, useEffect } from 'react';

import { ChatContext } from '../../../../context';

export const useUserPresence = ({ setChannels }) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!e.user?.id || !channel.state.members[e.user?.id]) {
            return channel;
          } else {
            channel.state.members.setIn([e.user.id, 'user'], e.user);
            return channel;
          }
        });

        return [...newChannels];
      });
    };

    client.on('user.presence.changed', handleEvent);
    client.on('user.updated', handleEvent);

    return () => {
      client.off('user.presence.changed', handleEvent);
      client.off('user.updated', handleEvent);
    };
  }, []);
};
