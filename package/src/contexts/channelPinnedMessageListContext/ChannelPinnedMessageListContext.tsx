import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel, MessageSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelPinnedMessageListContextValue = {
  channel: Channel;
  searchSource: MessageSearchSource;
};

export const ChannelPinnedMessageListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelPinnedMessageListContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelPinnedMessageListProvider = ({
  channel,
  children,
  searchSource: searchSourceProp,
}: PropsWithChildren<{ channel: Channel; searchSource?: MessageSearchSource }>) => {
  const { client } = useChatContext();
  const [defaultSearchSource] = useState(() => {
    const source = new MessageSearchSource(
      client,
      { pageSize: 25, allowEmptySearchString: true, resetOnNewSearchQuery: false },
      {
        messageSearch: {
          initialFilterConfig: {
            $or: {
              enabled: true,
              generate: ({ searchQuery }) => (searchQuery ? { text: { $q: searchQuery } } : {}),
            },
          },
        },
      },
    );
    source.messageSearchChannelFilters = { cid: channel.cid, members: undefined };
    source.messageSearchFilters = { pinned: true, type: undefined };
    source.activate();
    return source;
  });
  const searchSource = searchSourceProp ?? defaultSearchSource;

  return (
    <ChannelPinnedMessageListContext.Provider value={{ channel, searchSource }}>
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
