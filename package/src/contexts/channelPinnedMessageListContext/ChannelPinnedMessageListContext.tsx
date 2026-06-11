import React, { PropsWithChildren, useContext, useState } from 'react';

import { MessageSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { useChannelDetailsContext } from '../channelDetailsContext/channelDetailsContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelPinnedMessageListContextValue = {
  searchSource: MessageSearchSource;
};

export const ChannelPinnedMessageListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelPinnedMessageListContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelPinnedMessageListProvider = ({ children }: PropsWithChildren<unknown>) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailsContext();
  const [searchSource] = useState(() => {
    const source = new MessageSearchSource(
      client,
      { allowEmptySearchString: true, resetOnNewSearchQuery: false },
      {
        messageSearch: {
          initialFilterConfig: {
            text: {
              enabled: true,
              generate: ({ searchQuery }) => (searchQuery ? { text: { $q: searchQuery } } : null),
            },
          },
        },
      },
    );
    source.messageSearchChannelFilters = { cid: channel.cid };
    source.messageSearchFilters = { pinned: true };
    source.activate();
    return source;
  });

  return (
    <ChannelPinnedMessageListContext.Provider value={{ searchSource }}>
      {children}
    </ChannelPinnedMessageListContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelPinnedMessageListContext = () => {
  const contextValue = useContext(
    ChannelPinnedMessageListContext,
  ) as unknown as ChannelPinnedMessageListContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelPinnedMessageListContext hook was called outside of the ChannelPinnedMessageListContext provider. Render the pinned message list UI inside a ChannelPinnedMessageListProvider.',
    );
  }

  return contextValue;
};
