import { CalendarFormats } from './Streami18n';

/**
 * Calendar wording for the bundled locale.
 *
 * Only English ships. A language registered by an integrator supplies its own wording through
 * `dayjsLocaleConfigForLanguage` (or `registerTranslation`'s third argument) — the per-locale
 * blocks that used to live here were useless on their own once the matching `dayjs/locale/xx`
 * stopped being bundled with them.
 */
export const calendarFormats: Record<string, CalendarFormats> = {
  en: {
    lastDay: '[Yesterday]',
    lastWeek: 'dddd',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd [at] LT',
    sameDay: '[Today]',
    sameElse: 'L',
  },
};
