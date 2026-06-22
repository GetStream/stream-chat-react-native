import React, { PropsWithChildren, useContext, useMemo } from 'react';

import type { Channel } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelDetailsContextValue = {
  channel: Channel;
};
export const ChannelDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelDetailsContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelDetailsContextProvider = ({
  channel,
  children,
}: PropsWithChildren<{
  channel: Channel;
}>) => {
  const value = useMemo(() => ({ channel }), [channel]);

  return <ChannelDetailsContext.Provider value={value}>{children}</ChannelDetailsContext.Provider>;
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelDetailsContext = () => {
  const contextValue = useContext(ChannelDetailsContext) as unknown as ChannelDetailsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelDetailsContext hook was called outside of the ChannelDetailsContext provider. Render the ChannelDetails component (or its content) inside a ChannelDetailsContextProvider.',
    );
  }

  return contextValue;
};
