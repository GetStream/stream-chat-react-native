import React, { PropsWithChildren, createContext, useEffect, useMemo, useState } from 'react';

import { ChannelPaginator, Channel as ChannelType, Thread } from 'stream-chat';
import { useChatContext } from 'stream-chat-expo';

// The query the channel list shows. With a predefined filter the server owns the filter and sort.
const channelListRequestOptions = {
  predefined_filter: 'basic_channel_list_filter',
  state: true,
  watch: true,
};

export type AppContextType = {
  channel: ChannelType | undefined;
  channelListPaginator: ChannelPaginator | undefined;
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>;
  setThread: React.Dispatch<React.SetStateAction<Thread | null | undefined>>;
  thread: Thread | null | undefined;
};

export const AppContext = createContext<AppContextType>({
  channel: undefined,
  channelListPaginator: undefined,
  setChannel: () => {},
  setThread: () => {},
  thread: undefined,
});

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [channel, setChannel] = useState<ChannelType | undefined>(undefined);
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const { client } = useChatContext();

  // The app owns the channel list's paginator. It lives as long as the connected client, so the list
  // keeps its channels when its screen unmounts. `disconnectUser` empties the registered lists but
  // keeps them registered, so it is removed when the client goes away.
  const channelListPaginator = useMemo(
    () =>
      new ChannelPaginator({
        client,
        id: 'channel-list',
        requestOptions: { ...channelListRequestOptions, filter_values: { user_id: client.userID } },
      }),
    [client],
  );

  useEffect(() => {
    client.channelManager.insertPaginator({ paginator: channelListPaginator });
    return () => {
      client.channelManager.removePaginator(channelListPaginator);
      channelListPaginator.dispose();
    };
  }, [channelListPaginator, client]);

  return (
    <AppContext.Provider value={{ channel, channelListPaginator, setChannel, thread, setThread }}>
      {children}
    </AppContext.Provider>
  );
};
