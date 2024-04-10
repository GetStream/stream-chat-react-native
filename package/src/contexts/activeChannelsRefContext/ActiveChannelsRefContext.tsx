import React, { PropsWithChildren, useContext } from 'react';

import type { UnknownType } from '../../types/types';

import { getDisplayName } from '../utils/getDisplayName';

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

/**
 * @deprecated
 *
 * This will be removed in the next major version.
 *
 * Typescript currently does not support partial inference so if ChatContext
 * typing is desired while using the HOC withActiveChannelsRefContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withActiveChannelsRefContext = <P extends UnknownType>(
  Component: React.ComponentType<P>,
): React.ComponentType<Omit<P, 'activeChannels'>> => {
  const WithActiveChannelsContextComponent = (props: Omit<P, 'activeChannels'>) => {
    const ActiveChannelsContext = useActiveChannelsRefContext();

    return <Component {...(props as P)} activeChannels={ActiveChannelsContext} />;
  };
  WithActiveChannelsContextComponent.displayName = `WithActiveChannelsContext${getDisplayName(
    Component,
  )}`;
  return WithActiveChannelsContextComponent;
};
