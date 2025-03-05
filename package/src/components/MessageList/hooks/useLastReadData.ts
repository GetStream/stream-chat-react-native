import { useMemo } from 'react';

import type { ChannelState } from 'stream-chat';

import { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

import { getReadStates } from '../utils/getReadStates';

type UseLastReadDataParams = {
  messages: PaginatedMessageListContextValue['messages'] | ThreadContextValue['threadMessages'];
  userID: string | undefined;
  read?: ChannelState['read'];
  returnAllReadData?: boolean;
};

export const useLastReadData = (props: UseLastReadDataParams) => {
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
