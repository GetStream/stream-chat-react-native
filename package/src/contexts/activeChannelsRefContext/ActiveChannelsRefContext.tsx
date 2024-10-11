import React, { PropsWithChildren, useContext } from 'react';

type ActiveChannels = React.MutableRefObject<string[]>;

const ActiveChannelsContext = React.createContext({ current: [] } as ActiveChannels);

export const ActiveChannelsProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ActiveChannels;
}>) => <ActiveChannelsContext.Provider value={value}>{children}</ActiveChannelsContext.Provider>;

export const useActiveChannelsRefContext = () =>
  useContext(ActiveChannelsContext) as unknown as ActiveChannels;
