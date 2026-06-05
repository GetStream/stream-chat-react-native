import React, { PropsWithChildren, useContext, useState } from 'react';

import { UserSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { SelectionStore } from '../../state-store/selection-store';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelAddMembersContextValue = {
  selectionStore: SelectionStore;
  searchSource: UserSearchSource;
};

export const ChannelAddMembersContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelAddMembersContextValue,
);

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelAddMembersProvider = ({ children }: PropsWithChildren<unknown>) => {
  const { client } = useChatContext();
  const [selectionStore] = useState(() => new SelectionStore());
  const [searchSource] = useState(() => {
    const source = new UserSearchSource(
      client,
      { pageSize: 25 },
      {
        initialFilterConfig: {
          $or: {
            enabled: true,
            generate: ({ searchQuery }) => ({
              name: { $autocomplete: searchQuery ?? '' },
            }),
          },
        },
      },
    );
    source.activate();
    source.sort = [{ name: 1 }];
    return source;
  });

  return (
    <ChannelAddMembersContext.Provider value={{ selectionStore, searchSource }}>
      {children}
    </ChannelAddMembersContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const useChannelAddMembersContext = () => {
  const contextValue = useContext(
    ChannelAddMembersContext,
  ) as unknown as ChannelAddMembersContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelAddMembersContext hook was called outside of the ChannelAddMembersContext provider. Render the add-members UI inside a ChannelAddMembersProvider.',
    );
  }

  return contextValue;
};
