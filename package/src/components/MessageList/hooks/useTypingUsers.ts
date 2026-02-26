import { useMemo } from 'react';

import { useChatContext, useThreadContext, useTypingContext } from '../../../contexts';
import { filterTypingUsers } from '../utils/filterTypingUsers';

export const useTypingUsers = () => {
  const { client } = useChatContext();
  const { thread } = useThreadContext();
  const { typing } = useTypingContext();

  return useMemo(() => filterTypingUsers({ client, thread, typing }), [client, thread, typing]);
};
