type CalendarFormats = {
  lastDay: string;
  lastWeek: string;
  nextDay: string;
  nextWeek: string;
  sameDay: string;
  sameElse: string;
};

/**
 * Calendar formats for different languages.
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
  es: {
    lastDay: '[Ayer]',
    lastWeek: 'dddd',
    nextDay: '[Mañana]',
    nextWeek: 'dddd [a las] LT',
    sameDay: '[Hoy]',
    sameElse: 'L',
  },
  fr: {
    lastDay: '[Hier]',
    lastWeek: 'dddd',
    nextDay: '[Demain]',
    nextWeek: 'dddd [à] LT',
    sameDay: "[Aujourd'hui]",
    sameElse: 'L',
  },
  he: {
    lastDay: '[אתמול]',
    lastWeek: 'dddd',
    nextDay: '[מחר]',
    nextWeek: 'dddd [בשעה] LT',
    sameDay: '[היום]',
    sameElse: 'L',
  },
  hi: {
    lastDay: '[कल]',
    lastWeek: 'dddd',
    nextDay: '[कल]',
    nextWeek: 'dddd [को] LT',
    sameDay: '[आज]',
    sameElse: 'L',
  },
  it: {
    lastDay: '[Ieri]',
    lastWeek: 'dddd',
    nextDay: '[Domani]',
    nextWeek: 'dddd [alle] LT',
    sameDay: '[Oggi]',
    sameElse: 'L',
  },
  ja: {
    lastDay: '[昨日]',
    lastWeek: 'dddd',
    nextDay: '[明日]',
    nextWeek: 'dddd [の] LT',
    sameDay: '[今日]',
    sameElse: 'L',
  },
  ko: {
    lastDay: '[어제]',
    lastWeek: 'dddd',
    nextDay: '[내일]',
    nextWeek: 'dddd [LT에]',
    sameDay: '[오늘]',
    sameElse: 'L',
  },
  nl: {
    lastDay: '[Gisteren]',
    lastWeek: 'dddd',
    nextDay: '[Morgen]',
    nextWeek: 'dddd [om] LT',
    sameDay: '[Vandaag]',
    sameElse: 'L',
  },
  'pt-br': {
    lastDay: '[Ontem]',
    lastWeek: 'dddd',
    nextDay: '[Amanhã]',
    nextWeek: 'dddd [às] LT',
    sameDay: '[Hoje]',
    sameElse: 'L',
  },
  ru: {
    lastDay: '[Вчера]',
    lastWeek: 'dddd',
    nextDay: '[Завтра]',
    nextWeek: 'dddd [в] LT',
    sameDay: '[Сегодня]',
    sameElse: 'L', // L is the localized date format
  },
  tr: {
    lastDay: '[Dün]',
    lastWeek: 'dddd',
    nextDay: '[Yarın]',
    nextWeek: 'dddd [saat] LT',
    sameDay: '[Bugün]',
    sameElse: 'L',
  },
};
