import { useMemo } from 'react';

import type { ChannelState } from 'stream-chat';

import { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { getReadStates } from '../utils/getReadStates';

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
    [messages, read, returnAllReadData, userID],
  );
};
