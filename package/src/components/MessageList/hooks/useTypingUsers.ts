import { useMemo } from 'react';

import { TypingUsersState } from 'stream-chat';

import { useChannelContext, useChatContext, useThreadContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';
import { filterTypingUsers } from '../utils/filterTypingUsers';

const selector = (state: TypingUsersState) => ({ typing: state.typing });

export const useTypingUsers = () => {
  const { client } = useChatContext();
  const { channel } = useChannelContext();
  const { threadInstance } = useThreadContext();
  const { typing } = useStateStore(channel.state.typingStore, selector) ?? { typing: {} };

  return useMemo(
    () => filterTypingUsers({ client, threadId: threadInstance?.id, typing }),
    [client, threadInstance, typing],
  );
};
