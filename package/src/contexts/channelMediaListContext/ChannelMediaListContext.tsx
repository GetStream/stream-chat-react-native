import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel, MessageSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelMediaListContextValue = {
  channel: Channel;
  searchSource: MessageSearchSource;
};

export const ChannelMediaListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelMediaListContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelMediaListProvider = ({
  channel,
  children,
  searchSource: searchSourceProp,
}: PropsWithChildren<{ channel: Channel; searchSource?: MessageSearchSource }>) => {
  const { client } = useChatContext();
  const [defaultSearchSource] = useState(() => {
    const source = new MessageSearchSource(client, {
      allowEmptySearchString: true,
      pageSize: 25,
      resetOnNewSearchQuery: false,
    });
    source.messageSearchChannelFilters = { cid: channel.cid, members: undefined };
    source.messageSearchFilters = {
      'attachments.type': { $in: ['image', 'video'] },
      type: undefined,
    };
    // Newest media first so the grid reads top-to-bottom from most recent.
    source.messageSearchSort = { created_at: -1 };
    source.activate();
    return source;
  });
  const searchSource = searchSourceProp ?? defaultSearchSource;

  return (
    <ChannelMediaListContext.Provider value={{ channel, searchSource }}>
      {children}
    </ChannelMediaListContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelMediaListContext = () => {
  const contextValue = useContext(
    ChannelMediaListContext,
  ) as unknown as ChannelMediaListContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelMediaListContext hook was called outside of the ChannelMediaListContext provider. Render the media list UI inside a ChannelMediaListProvider.',
    );
  }

  return contextValue;
};
