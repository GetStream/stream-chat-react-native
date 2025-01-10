import { useMemo } from 'react';

import { getReadStates } from '../utils/getReadStates';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

type UseLastReadDataParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  messages:
    | PaginatedMessageListContextValue<StreamChatGenerics>['messages']
    | ThreadContextValue<StreamChatGenerics>['threadMessages'];
  userID: string | undefined;
  read?: ChannelState<StreamChatGenerics>['read'];
  returnAllReadData?: boolean;
};

export const useLastReadData = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: UseLastReadDataParams<StreamChatGenerics>,
) => {
  const { messages, read, returnAllReadData = true, userID } = props;

  return useMemo(
    () =>
      getReadStates(
        messages.filter(({ user }) => user?.id === userID),
        read,
        returnAllReadData,
      ),
    [messages, read, userID],
  );
};
