import { useMemo } from 'react';

import { TypingUsersState } from 'stream-chat';

import { useChannelContext, useChatContext, useThreadContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';
import { filterTypingUsers } from '../utils/filterTypingUsers';

const selector = (state: TypingUsersState) => ({ typing: state.typing });

export const useTypingUsers = () => {
  const { client } = useChatContext();
  const { channel } = useChannelContext();
  const { thread } = useThreadContext();
  const { typing } = useStateStore(channel.state.typingStore, selector) ?? { typing: {} };

  return useMemo(() => filterTypingUsers({ client, thread, typing }), [client, thread, typing]);
};
