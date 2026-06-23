import React, { PropsWithChildren, useContext, useMemo, useState } from 'react';

import { UserSearchSource } from 'stream-chat';

import { useChatContext } from '..';
import { NotificationTargetProvider } from '../../components/Notifications/NotificationTargetContext';
import { useChannelActions } from '../../hooks/actions/useChannelActions';
import { useStableCallback } from '../../hooks/useStableCallback';
import { SelectionStore } from '../../state-store/selection-store';
import { useChannelDetailsContext } from '../channelDetailsContext/channelDetailsContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * @experimental This API is experimental and is subject to change.
 */
export type ChannelAddMembersContextValue = {
  selectionStore: SelectionStore;
  searchSource: UserSearchSource;
  /**
   * Adds the currently selected members to the channel. Resolves on success and
   * rejects if the request fails.
   */
  submit: () => Promise<void>;
};

export const ChannelAddMembersContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelAddMembersContextValue,
);

/**
 * Builds the {@link ChannelAddMembersContextValue}. Rendered inside the
 * {@link NotificationTargetProvider} so that notifications emitted by `submit`
 * (via {@link useChannelActions}) resolve to the add-members host.
 */
const ChannelAddMembersContextProviderInner = ({ children }: PropsWithChildren<unknown>) => {
  const { client } = useChatContext();
  const { channel } = useChannelDetailsContext();
  const { addMembers } = useChannelActions(channel);
  const [selectionStore] = useState(() => new SelectionStore());
  const [searchSource] = useState(() => {
    const source = new UserSearchSource(
      client,
      { pageSize: 25, allowEmptySearchString: true, resetOnNewSearchQuery: false },
      {
        initialFilterConfig: {
          $or: {
            enabled: true,
            generate: ({ searchQuery }) =>
              searchQuery
                ? {
                    name: { $autocomplete: searchQuery },
                  }
                : {},
          },
        },
      },
    );
    source.activate();
    source.sort = [{ name: 1 }];
    return source;
  });

  const submit = useStableCallback(async () => {
    const ids = Array.from(selectionStore.state.getLatestValue().selectedIds);
    let failed = false;
    let firstError: unknown;
    await addMembers(ids, {
      onFailure: (error) => {
        failed = true;
        firstError = error;
      },
    });
    if (failed) {
      throw firstError;
    }
  });

  const value = useMemo(
    () => ({ selectionStore, searchSource, submit }),
    [selectionStore, searchSource, submit],
  );

  return (
    <ChannelAddMembersContext.Provider value={value}>{children}</ChannelAddMembersContext.Provider>
  );
};

/**
 * @experimental This API is experimental and is subject to change.
 */
export const ChannelAddMembersProvider = ({ children }: PropsWithChildren<unknown>) => {
  const { channel } = useChannelDetailsContext();

  return (
    <NotificationTargetProvider
      hostId={`channel-add-members:${channel.cid}`}
      panel='channel-details'
    >
      <ChannelAddMembersContextProviderInner>{children}</ChannelAddMembersContextProviderInner>
    </NotificationTargetProvider>
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
