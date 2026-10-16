import type { PropsWithChildren } from 'react';
import React, { useMemo, useState } from 'react';

import type { Channel, StreamChat } from 'stream-chat';

import { chatUserId } from '../chatConfig';

export type AppContextValue = {
  channel: Channel | undefined;
  setChannel: (channel: Channel) => void;
};

export const AppContext = React.createContext<AppContextValue>({
  setChannel: () => {},
  channel: undefined,
});

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';

export const nanoid = (size: number = 21): string => {
  let id = '';
  for (let i = 0; i < size; i++) {
    const r = Math.floor(Math.random() * ALPHABET.length);
    id += ALPHABET[r];
  }
  return id;
};

export const createChannel = (client: StreamChat) =>
  client.channel('messaging', nanoid(), {
    members: [{ user_id: chatUserId }],
  });

export const AppProvider = ({ client, children }: PropsWithChildren<{ client: StreamChat }>) => {
  const [channel, setChannel] = useState<Channel>(() => createChannel(client));

  const contextValue = useMemo(() => ({ channel, setChannel }), [channel]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
