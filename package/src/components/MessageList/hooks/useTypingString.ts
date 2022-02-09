import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useTypingContext } from '../../../contexts/typingContext/TypingContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { filterTypingUsers } from '../utils/filterTypingUsers';

export const useTypingString = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { client } = useChatContext<StreamChatClient>();
  const { thread } = useThreadContext<StreamChatClient>();
  const { t } = useTranslationContext();
  const { typing } = useTypingContext<StreamChatClient>();

  const filteredTypingUsers = filterTypingUsers({ client, thread, typing });

  if (filteredTypingUsers.length === 1) {
    return t('{{ user }} is typing', { user: filteredTypingUsers[0] });
  }

  if (filteredTypingUsers.length > 1) {
    /**
     * Joins the multiple names with number after first name
     * example: "Dan and Neil"
     */
    return t('{{ firstUser }} and {{ nonSelfUserLength }} more are typing', {
      firstUser: filteredTypingUsers[0],
      nonSelfUserLength: filteredTypingUsers.length - 1,
    });
  }

  return '';
};
