import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { UnknownType } from '../../types/types';

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

export const withActiveChannelsRefContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, 'activeChannels'>> => {
  const WithActiveChannelsContextComponent = (props: Omit<P, 'activeChannels'>) => {
    const ActiveChannelsContext = useActiveChannelsRefContext();

    return <Component {...(props as P)} activeChannels={ActiveChannelsContext} />;
  };
  WithActiveChannelsContextComponent.displayName = `WithActiveChannelsContext${getDisplayName(
    Component,
  )}`;
  return WithActiveChannelsContextComponent;
};
