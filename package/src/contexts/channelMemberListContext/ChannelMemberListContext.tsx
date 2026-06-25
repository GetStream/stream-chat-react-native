import React, { PropsWithChildren, useContext, useState } from 'react';

import { Channel, ChannelMemberSearchSource } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelMemberListContextValue = {
  searchSource: ChannelMemberSearchSource;
};

export const ChannelMemberListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelMemberListContextValue,
);

export const ChannelMemberListProvider = ({
  channel,
  children,
  searchSource: searchSourceProp,
}: PropsWithChildren<{ channel: Channel; searchSource?: ChannelMemberSearchSource }>) => {
  const [defaultSearchSource] = useState(() => {
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
  const searchSource = searchSourceProp ?? defaultSearchSource;

  return (
    <ChannelMemberListContext.Provider value={{ searchSource }}>
      {children}
    </ChannelMemberListContext.Provider>
  );
};

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
