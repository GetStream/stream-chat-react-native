import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

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
  const { typing } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

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

  if (nonSelfUsers.length === 2) {
    /**
     * Joins the two names without commas
     * example: "Dan and Neil"
     */
    return t('{{ firstUser }} and {{ secondUser }} are typing', {
      firstUser: nonSelfUsers[0],
      secondUser: nonSelfUsers[1],
    });
  }

  if (nonSelfUsers.length > 2) {
    /**
     * Joins all names with commas, the final one gets ", and" (oxford comma!)
     * example: "Dan, Neil, and Vir"
     */
    return t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing', {
      commaSeparatedUsers: nonSelfUsers.slice(0, -1).join(', '),
      lastUser: nonSelfUsers.slice(-1),
    });
  }

  return '';
};
