import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import type { Channel } from 'stream-chat';

import { SignalStore } from '../../state-store/signal-store';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelDetailsContextValue = {
  channel: Channel;
  /**
   * Signals all ChannelDetails modals to close themselves.
   */
  closeModals: () => void;
  signalStore: SignalStore;
};
export const ChannelDetailsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelDetailsContextValue,
);

export const ChannelDetailsContextProvider = ({
  channel,
  children,
}: PropsWithChildren<{
  channel: Channel;
}>) => {
  const [signalStore] = useState(() => new SignalStore());
  const closeModals = useCallback(() => signalStore.signal(), [signalStore]);

  const value = useMemo(
    () => ({ channel, closeModals, signalStore }),
    [channel, closeModals, signalStore],
  );

  return <ChannelDetailsContext.Provider value={value}>{children}</ChannelDetailsContext.Provider>;
};

export const useChannelDetailsContext = () => {
  const contextValue = useContext(ChannelDetailsContext) as unknown as ChannelDetailsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelDetailsContext hook was called outside of the ChannelDetailsContext provider. Render the ChannelDetails component (or its content) inside a ChannelDetailsContextProvider.',
    );
  }

  return contextValue;
};
