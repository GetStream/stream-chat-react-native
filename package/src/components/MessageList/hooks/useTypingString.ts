import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useTypingContext } from '../../../contexts/typingContext/TypingContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import { filterTypingUsers } from '../utils/filterTypingUsers';

export const useTypingString = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>() => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();
  const { typing } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

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
