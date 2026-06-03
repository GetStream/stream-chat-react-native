import { useMemo } from 'react';

import Dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { UserResponse } from 'stream-chat';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';

Dayjs.extend(relativeTime);

const hasFromNow = (value: unknown): value is { fromNow: () => string; isValid?: () => boolean } =>
  typeof (value as { fromNow?: unknown })?.fromNow === 'function';

/**
 * Returns the localized presence status string for a user:
 *   - `t('Online')` when `user.online === true`
 *   - `t('Last seen {{relativeTime}}')` when offline with a valid `last_active`
 *   - `t('Offline')` otherwise (including `user === undefined`)
 *
 * Uses `tDateTimeParser` from the translation context so the relative-time format
 * follows the configured locale.
 * @experimental This hook is experimental and is subject to change.
 */
export const useUserActivityStatus = (user?: UserResponse): string => {
  const { t, tDateTimeParser } = useTranslationContext();

  return useMemo(() => {
    if (user?.online) return t('Online');

    if (user?.last_active) {
      const parsed = tDateTimeParser(user.last_active);
      if (hasFromNow(parsed) && (!parsed.isValid || parsed.isValid())) {
        return t('Last seen {{relativeTime}}', { relativeTime: parsed.fromNow() });
      }
    }

    return t('Offline');
  }, [t, tDateTimeParser, user?.last_active, user?.online]);
};
