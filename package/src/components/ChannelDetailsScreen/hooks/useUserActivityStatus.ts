import { useMemo } from 'react';

import type { UserResponse } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../utils/i18n/getDateString';

/**
 * Returns the localized presence status string for a user:
 *   - `t('Online')` when `user.online === true`
 *   - `t('timestamp/UserActivityStatus')` (e.g. "Last seen 10 minutes ago") when offline
 *     with a valid `last_active`
 *   - `t('Offline')` otherwise (including `user === undefined` or an unparseable date)
 *
 * The relative time is produced through the shared `getDateString` + translation-key
 * pipeline used by message timestamps, so the format follows the configured locale.
 * @experimental This hook is experimental and is subject to change.
 */
export const useUserActivityStatus = (user?: UserResponse): string => {
  const { t, tDateTimeParser } = useTranslationContext();

  return useMemo(() => {
    if (user?.online) return t('Online');

    if (user?.last_active) {
      const lastSeen = getDateString({
        date: user.last_active,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/UserActivityStatus',
      });
      if (typeof lastSeen === 'string') {
        return lastSeen;
      }
    }

    return t('Offline');
  }, [t, tDateTimeParser, user?.last_active, user?.online]);
};
