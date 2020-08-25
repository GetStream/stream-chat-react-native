import { useContext } from 'react';

import {
  ChatContext,
  ChannelContext,
  TranslationContext,
} from '../../../context';

export const useTypingString = () => {
  const { client } = useContext(ChatContext);
  const { t } = useContext(TranslationContext);
  const { typing } = useContext(ChannelContext);

  const typingKeys = Object.keys(typing);
  const nonSelfUsers = [];
  typingKeys.forEach((item, i) => {
    if (client.user.id === typing[typingKeys[i]].user.id) {
      return;
    }
    nonSelfUsers.push(
      typing[typingKeys[i]].user.name || typing[typingKeys[i]].user.id,
    );
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
