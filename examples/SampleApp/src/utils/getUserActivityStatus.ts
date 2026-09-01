import { convertTimestampToDate } from 'stream-chat';
import type { UserResponse } from 'stream-chat';
import type { TranslationContextValue } from 'stream-chat-react-native';

/**
 * Both strings here already exist as SDK keys, so this reuses them rather than hardcoding English —
 * which is why the subtitle follows the language picked in the drawer's secret menu.
 *
 * `timestamp.UserActivityStatus` carries the relative time as a formatter expression, so `t` is
 * given a `Date` and dayjs renders it in the active locale. Formatting it here with
 * `Dayjs().fromNow()` would bypass that and pin the wording to English.
 *
 * `last_active` arrives as a unix-**nanosecond** number, which the formatter would read as
 * milliseconds — hence the conversion.
 */
export const getUserActivityStatus = (
  t: TranslationContextValue['t'],
  user?: UserResponse,
): string => {
  if (!user) {
    return '';
  }

  if (user.online) {
    return t('common.presence.online.label', 'Online');
  }

  if (!user.last_active) {
    return '';
  }

  return t('timestamp.UserActivityStatus', {
    timestamp: convertTimestampToDate(user.last_active),
  });
};
