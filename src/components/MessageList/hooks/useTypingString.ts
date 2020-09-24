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
} from '../../../types/types';

export const useTypingString = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>() => {
  const { typing } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const typingKeys = Object.keys(typing);
  const nonSelfUsers: string[] = [];
  typingKeys.forEach((_, i) => {
    if (client?.user?.id === typing?.[typingKeys[i]]?.user?.id) {
      return;
    }
    const user =
      typing?.[typingKeys[i]]?.user?.name || typing?.[typingKeys[i]]?.user?.id;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  let outStr = '';
  if (nonSelfUsers.length === 1) {
    outStr = t('{{ user }} is typing...', { user: nonSelfUsers[0] });
  } else if (nonSelfUsers.length === 2) {
    /**
     * Joins the two names without commas
     * example: "bob and sam"
     */
    outStr = t('{{ firstUser }} and {{ secondUser }} are typing...', {
      firstUser: nonSelfUsers[0],
      secondUser: nonSelfUsers[1],
    });
  } else if (nonSelfUsers.length > 2) {
    /**
     * Joins all names with commas, the final one gets ", and" (oxford comma!)
     * example: "bob, joe, and sam"
     */
    outStr = t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
      commaSeparatedUsers: nonSelfUsers.slice(0, -1).join(', '),
      lastUser: nonSelfUsers.slice(-1),
    });
  }

  return outStr;
};
