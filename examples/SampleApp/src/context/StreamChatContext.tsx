import React from 'react';
import { PropsWithChildren, createContext, useState } from 'react';
import { Channel as ChannelType } from 'stream-chat';
import { ThreadContextValue } from 'stream-chat-react-native';

export type StreamChatContextType = {
  channel: ChannelType | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>;
  setThread: React.Dispatch<React.SetStateAction<ThreadContextValue['thread'] | undefined>>;
  thread: ThreadContextValue['thread'] | undefined;
};

export const StreamChatContext = createContext<StreamChatContextType>({
  channel: undefined,
  setChannel: () => {},
  setThread: () => {},
  thread: undefined,
});

export const StreamChatProvider = ({ children }: PropsWithChildren) => {
  const [channel, setChannel] = useState<ChannelType | undefined>(undefined);
  const [thread, setThread] = useState<ThreadContextValue['thread'] | undefined>(undefined);

  return (
    <StreamChatContext.Provider value={{ channel, setChannel, thread, setThread }}>
      {children}
    </StreamChatContext.Provider>
  );
};

export const useStreamChatContext = () => {
  const context = React.useContext(StreamChatContext);
  if (!context) {
    throw new Error('useStreamChatContext must be used within a StreamChatProvider');
  }
  return context;
};
