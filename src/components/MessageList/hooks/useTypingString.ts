import { useChatContext } from '../../../contexts/chatContext/ChatContext';
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

export const useTypingString = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();
  const { typing } = useTypingContext<At, Ch, Co, Ev, Me, Re, Us>();

  const typingKeys = Object.keys(typing);
  const nonSelfUsers: string[] = [];
  typingKeys.forEach((typingKey) => {
    if (client?.user?.id === typing?.[typingKey]?.user?.id) {
      return;
    }
    const user =
      typing?.[typingKey]?.user?.name || typing?.[typingKey]?.user?.id;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  if (nonSelfUsers.length === 1) {
    return t('{{ user }} is typing', { user: nonSelfUsers[0] });
  }

  if (nonSelfUsers.length > 1) {
    /**
     * Joins the multiple names with number after first name
     * example: "Dan and Neil"
     */
    return t('{{ firstUser }} and {{ nonSelfUserLength }} more are typing', {
      firstUser: nonSelfUsers[0],
      nonSelfUserLength: nonSelfUsers.length - 1,
    });
  }

  return '';
};
