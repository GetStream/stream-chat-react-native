import { useMemo } from 'react';

import { useTypingUsers } from './useTypingUsers';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

export const useTypingString = () => {
  const { t } = useTranslationContext();

  const typingUsers = useTypingUsers();

  const typingUsernames = useMemo(
    () => typingUsers.map((typingUser) => typingUser.name || typingUser.id),
    [typingUsers],
  );

  if (typingUsernames.length === 1) {
    return t('{{ user }} is typing', { user: typingUsernames[0] });
  }

  if (typingUsernames.length > 1) {
    /**
     * Joins the multiple names with number after first name
     * example: "Dan and Neil"
     */
    return t('{{ firstUser }} and {{ nonSelfUserLength }} more are typing', {
      firstUser: typingUsernames[0],
      nonSelfUserLength: typingUsernames.length - 1,
    });
  }

  return '';
};
