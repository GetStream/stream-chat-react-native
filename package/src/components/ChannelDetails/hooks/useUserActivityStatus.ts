import { useMemo } from 'react';

import type { UserResponse } from 'stream-chat';

import { convertTimestampToDate } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../i18n/utils';

/**
 * Returns the localized presence status of a user: "Online", a last-seen time such as "Last seen
 * 10 minutes ago" (the `timestamp.UserActivityStatus` translation key) when offline with a known
 * `last_active`, and "Offline" otherwise.
 *
 * @param user The user.
 * @returns The translated status text.
 */
export const useUserActivityStatus = (user?: UserResponse): string => {
  const { t, tDateTimeParser } = useTranslationContext();

  return useMemo(() => {
    if (user?.online) return t('common.presence.online.label', 'Online');

    if (user?.last_active != null) {
      const lastSeen = getDateString({
        messageCreatedAt: convertTimestampToDate(user.last_active),
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.UserActivityStatus',
      });
      if (typeof lastSeen === 'string') {
        return lastSeen;
      }
    }

    return t('common.presence.offline.label', 'Offline');
  }, [t, tDateTimeParser, user?.last_active, user?.online]);
};
