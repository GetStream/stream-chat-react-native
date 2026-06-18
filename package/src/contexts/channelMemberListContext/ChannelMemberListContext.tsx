import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel, ChannelMemberSearchSource } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelMemberListContextValue = {
  channel: Channel;
  searchSource: ChannelMemberSearchSource;
};

export const ChannelMemberListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelMemberListContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelMemberListProvider = ({
  channel,
  children,
}: PropsWithChildren<{ channel: Channel }>) => {
  const [searchSource] = useState(() => {
    const source = new ChannelMemberSearchSource(
      channel,
      {
        allowEmptySearchString: true,
        pageSize: 25,
        resetOnNewSearchQuery: false,
      },
      {
        initialFilterConfig: {
          $or: {
            enabled: true,
            generate: ({ searchQuery }) =>
              searchQuery ? { name: { $autocomplete: searchQuery } } : {},
          },
        },
      },
    );
    source.sort = { name: 1 };
    source.activate();
    return source;
  });

  return (
    <ChannelMemberListContext.Provider value={{ channel, searchSource }}>
      {children}
    </ChannelMemberListContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelMemberListContext = () => {
  const contextValue = useContext(
    ChannelMemberListContext,
  ) as unknown as ChannelMemberListContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelMemberListContext hook was called outside of the ChannelMemberListContext provider. Render the member list UI inside a ChannelMemberListProvider.',
    );
  }

  return contextValue;
};
