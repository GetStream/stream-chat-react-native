import React, { PropsWithChildren, useContext } from 'react';

import type { Channel } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelDetailsContextValue = {
  channel: Channel;
  onBack?: () => void;
  /** Fired after the channel is no longer available to the current user (delete or leave). */
  onChannelDismiss?: () => void;
};

export const ChannelDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelDetailsContextValue,
);

export const ChannelDetailsContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelDetailsContextValue;
}>) => (
  <ChannelDetailsContext.Provider value={value as unknown as ChannelDetailsContextValue}>
    {children}
  </ChannelDetailsContext.Provider>
);

export const useChannelDetailsContext = () => {
  const contextValue = useContext(ChannelDetailsContext) as unknown as ChannelDetailsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelDetailsContext hook was called outside of the ChannelDetailsContext provider. Render the ChannelDetailsScreen component (or its content) inside a ChannelDetailsContextProvider.',
    );
  }

  return contextValue;
};
