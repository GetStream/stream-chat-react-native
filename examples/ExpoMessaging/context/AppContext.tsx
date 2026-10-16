import React, { PropsWithChildren, createContext, useState } from 'react';

import { Channel as ChannelType, Thread } from 'stream-chat';

export type AppContextType = {
  channel: ChannelType | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>;
  setThread: React.Dispatch<React.SetStateAction<Thread | null | undefined>>;
  thread: Thread | null | undefined;
};

export const AppContext = createContext<AppContextType>({
  channel: undefined,
  setChannel: () => {},
  setThread: () => {},
  thread: undefined,
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [channel, setChannel] = useState<ChannelType | undefined>(undefined);
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);

  return (
    <AppContext.Provider value={{ channel, setChannel, thread, setThread }}>
      {children}
    </AppContext.Provider>
  );
};
