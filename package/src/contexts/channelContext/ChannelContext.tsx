import React, { PropsWithChildren, useContext } from 'react';

import type { Channel } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelContextValue = {
  /**
   * The `stream-chat` channel instance.
   *
   * @overrideType Channel
   */
  channel: Channel;
  /** Limits users to one reaction; picking another replaces the previous. Defaults to false. */
  enforceUniqueReaction: boolean;
  /**
   * Renders the inline date separator above a system message that is the first of its day.
   * Defaults to false: a system message on a day boundary then renders no separator for that day.
   */
  allowDateSeparatorForSystemMessages: boolean;
  /** Hides the inline date separators. Defaults to false. */
  hideDateSeparators: boolean;
  hideStickyDateHeader: boolean;
  /**
   * Returns true when `Channel` is about to load an initial targeted message.
   *
   * @internal
   */
  hasPendingInitialTargetLoad?: () => boolean;
  disabled?: boolean;
  enableMessageGroupingByUser?: boolean;
  /** Maximum time in milliseconds between messages that are still grouped together. */
  maxTimeBetweenGroupedMessages?: number;
};

export const ChannelContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelContextValue,
);

export const ChannelProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelContextValue;
}>) => (
  <ChannelContext.Provider value={value as unknown as ChannelContextValue}>
    {children}
  </ChannelContext.Provider>
);

export const useChannelContext = () => {
  const contextValue = useContext(ChannelContext) as unknown as ChannelContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelContext hook was called outside of the ChannelContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
