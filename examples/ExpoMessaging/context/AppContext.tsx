import { PropsWithChildren, createContext, useState } from 'react';
import { Channel as ChannelType } from 'stream-chat';
import { ThreadContextValue } from 'stream-chat-expo';

export type AppContextType = {
  channel: ChannelType | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>;
  setThread: React.Dispatch<
    React.SetStateAction<ThreadContextValue['thread'] | undefined>
  >;
  thread: ThreadContextValue['thread'] | undefined;
};

export const AppContext = createContext<AppContextType>({
  channel: undefined,
  setChannel: undefined,
  setThread: undefined,
  thread: undefined,
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [channel, setChannel] = useState<ChannelType | undefined>(undefined);
  const [thread, setThread] = useState<
    ThreadContextValue['thread'] | undefined
  >(undefined);

  return (
    <AppContext.Provider value={{ channel, setChannel, thread, setThread }}>
      {children}
    </AppContext.Provider>
  );
};
