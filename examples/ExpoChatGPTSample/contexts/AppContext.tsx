import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import { ChannelPaginator } from 'stream-chat';
import type { Channel, SortParamRequest, StreamChat } from 'stream-chat';

import { chatUserId } from '../chatConfig';

const channelListFilters = { members: { $in: [chatUserId] } };
const channelListSort: SortParamRequest[] = [{ direction: -1, field: 'last_updated' }];

export type AppContextValue = {
  channel: Channel | undefined;
  channelListPaginator: ChannelPaginator | undefined;
  setChannel: (channel: Channel) => void;
};

export const AppContext = React.createContext<AppContextValue>({
  setChannel: () => {},
  channel: undefined,
  channelListPaginator: undefined,
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

  // The app owns the channel list's paginator. It lives as long as the client, so the list keeps its
  // channels when the drawer unmounts. `disconnectUser` empties the registered lists but keeps them
  // registered, so it is removed when the client goes away.
  const channelListPaginator = useMemo(
    () =>
      new ChannelPaginator({
        client,
        filters: channelListFilters,
        id: 'channel-list',
        sort: channelListSort,
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

  const contextValue = useMemo(
    () => ({ channel, channelListPaginator, setChannel }),
    [channel, channelListPaginator],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
