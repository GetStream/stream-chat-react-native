import Dayjs from 'dayjs';
import 'dayjs/locale/de';

import { addOrUpdateDayjsLocale } from 'stream-chat/i18n';
import type { CalendarFormats } from 'stream-chat/i18n';

import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import { getDateString } from '../../i18n/utils';
import { englishCalendarFormats, Streami18n } from '../i18n/Streami18n';

describe('Jest Timezone', () => {
  it('global config should set the timezone to UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

describe('runtimeDefaults', () => {
  it('carries per-key calendarFormats for exactly the two documented keys', () => {
    // A per-key `calendarFormats` replaces the dayjs locale's calendar wholesale, so
    // `dayjsLocaleConfigForLanguage` never reaches these two — they have to be overridden key by
    // key. Adding a third silently strands English day words in a translated app, so it has to
    // fail here first and be documented.
    const withCalendarFormats = Object.entries(runtimeDefaults)
      .filter(([, value]) => value.includes('calendarFormats:'))
      .map(([key]) => key)
      .sort();

    expect(withCalendarFormats).toStrictEqual([
      'timestamp.ChannelPreviewStatus',
      'timestamp.ThreadListItem',
    ]);
  });

  it('holds English inside a formatter expression for exactly the three documented keys', () => {
    // The broader version of the guard above. A bundled formatter value can hide English in two
    // places: inside a `calendarFormats` bracket literal (`[Yesterday]`), or as prose sitting
    // beside the interpolation (`Last seen {{ … }}`). Either way `dayjsLocaleConfigForLanguage`
    // cannot reach it and the key has to be overridden by hand, so the set has to stay closed.
    // A formatter value pipes through a named formatter. Matched by substring rather than a
    // balanced-brace regex, because `calendarFormats:` embeds a JSON object and the inner braces
    // defeat the obvious pattern.
    const isFormatterExpression = (value: string) => value.includes('{{') && value.includes('|');

    const englishInsideFormatter = Object.entries(runtimeDefaults)
      // Only formatter values. Ordinary bundled prose like 'Avatar of {{name}}' is translated by
      // overriding the key like any other string; these are format specs that happen to embed copy.
      .filter(([, value]) => isFormatterExpression(value))
      .filter(([, value]) => {
        const outsideInterpolation = value.replace(/\{\{[^}]*\}\}/g, '');
        const insideBrackets = [...value.matchAll(/\[([A-Za-z][^\]]*)\]/g)].map((m) => m[1]);
        return /[A-Za-z]/.test(outsideInterpolation) || insideBrackets.length > 0;
      })
      .map(([key]) => key)
      .sort();

    expect(englishInsideFormatter).toStrictEqual([
      'timestamp.ChannelPreviewStatus',
      'timestamp.ThreadListItem',
      'timestamp.UserActivityStatus',
    ]);
  });
});

describe('English calendar wording', () => {
  // Every `timestamp.*` key formatted with `calendar: true` and no `calendarFormats` of its own. The
  // other two calendar keys carry their own formats and so never read the locale.
  const CALENDAR_KEYS = [
    'timestamp.ImageGalleryHeader',
    'timestamp.InlineDateSeparator',
    'timestamp.MessageSystem',
    'timestamp.StickyHeader',
  ] as const;

  /**
   * Noon, so the calendar bucket a date falls into does not depend on the wall clock: dayjs measures
   * the difference from the start of today, and ±12h can never cross into the neighbouring bucket.
   */
  const noonOffsetByDays = (days: number) => {
    const date = new Date();
    date.setUTCHours(12, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() + days);
    return date;
  };

  /** Spelled out through `Intl` rather than dayjs, so the expectation is independent of the subject. */
  const weekdayName = (date: Date, locale = 'en') =>
    new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: 'long' }).format(date);

  let t: Streami18n['t'];
  let tDateTimeParser: Streami18n['tDateTimeParser'];

  const render = (key: string, date: Date) =>
    getDateString({ messageCreatedAt: date, t, tDateTimeParser, timestampTranslationKey: key });

  beforeAll(async () => {
    const i18n = new Streami18n({ logger: () => {} });
    ({ t, tDateTimeParser } = await i18n.init());
  });

  it.each(CALENDAR_KEYS)('%s renders the day alone, with no time appended', (key) => {
    // The regression these guard: dayjs's own calendar defaults are `[Today at] h:mm A`,
    // `[Last] dddd [at] h:mm A` and so on, which is what renders when the `en` locale carries no
    // calendar config.
    expect(render(key, noonOffsetByDays(0))).toBe('Today');
    expect(render(key, noonOffsetByDays(-1))).toBe('Yesterday');
    expect(render(key, noonOffsetByDays(1))).toBe('Tomorrow');

    const lastWeek = noonOffsetByDays(-3);
    expect(render(key, lastWeek)).toBe(weekdayName(lastWeek));
  });

  describe('is a default, not an override', () => {
    // Each of these writes to the shared dayjs `en` locale, so it is put back afterwards. Applying all
    // six slots is a full reset: `updateLocale` replaces the `calendar` key wholesale.
    afterEach(() => {
      addOrUpdateDayjsLocale('en', { calendar: englishCalendarFormats });
    });

    // Read off `init()` rather than written as `Streami18nState`: the bare type defaults its catalog to
    // `AnyTranslationCatalog`, and `t` is contravariant in its options, so the concrete one does not
    // assign to it.
    const stickyHeader = (
      { t, tDateTimeParser }: Awaited<ReturnType<Streami18n['init']>>,
      date: Date,
    ) =>
      getDateString({
        messageCreatedAt: date,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.StickyHeader',
      });

    it('yields to a config the app registered on dayjs itself', async () => {
      // What the v10 migration guide suggests for an app bringing its own `DateTimeParser`, and what
      // this SDK used to do at module scope. It runs before the constructor, so it has to survive it.
      addOrUpdateDayjsLocale('en', { calendar: { sameDay: '[Right now]' } as CalendarFormats });

      const state = await new Streami18n({ logger: () => {} }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Right now');
      // Slots the app left alone still get the bundled wording rather than dayjs's defaults.
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('Yesterday');
    });

    it('yields to dayjsLocaleConfigForLanguage, per slot', async () => {
      const state = await new Streami18n({
        dayjsLocaleConfigForLanguage: { calendar: { sameDay: '[Right now]' } as CalendarFormats },
        logger: () => {},
      }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Right now');
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('Yesterday');
    });

    it('does not reach a language with its own dayjs locale and calendar config', async () => {
      const state = await new Streami18n({
        dayjsLocaleConfigForLanguage: {
          calendar: {
            lastDay: '[gestern]',
            lastWeek: 'dddd',
            nextDay: '[morgen]',
            nextWeek: 'dddd [um] LT',
            sameDay: '[heute]',
            sameElse: 'L',
          },
        },
        language: 'de',
        logger: () => {},
      }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('heute');
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('gestern');
      expect(stickyHeader(state, noonOffsetByDays(-3))).toBe(
        weekdayName(noonOffsetByDays(-3), 'de'),
      );
    });

    it('yields to registerTranslation, before init', async () => {
      const i18n = new Streami18n({ logger: () => {} });
      i18n.registerTranslation(
        'en',
        {},
        { calendar: { sameDay: '[Right now]' } as CalendarFormats },
      );

      const state = await i18n.init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Right now');
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('Yesterday');
    });

    it('yields to a config applied on the parser after construction', async () => {
      const state = await new Streami18n({ logger: () => {} }).init();
      addOrUpdateDayjsLocale('en', { calendar: { sameDay: '[Right now]' } as CalendarFormats });

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Right now');
    });

    it('yields to a preconfigured DateTimeParser the integrator brought', async () => {
      // The `DateTimeParser` route: we write to *their* module's registry, so their own `en` calendar
      // has to be read off that module rather than assumed absent.
      addOrUpdateDayjsLocale(
        'en',
        { calendar: { sameDay: '[Right now]' } as CalendarFormats },
        Dayjs,
      );

      const state = await new Streami18n({ DateTimeParser: Dayjs, logger: () => {} }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Right now');
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('Yesterday');
    });

    it('does not touch a key that carries its own calendarFormats', async () => {
      // A per-key `calendarFormats` replaces the locale's calendar wholesale, so this route bypasses
      // the dayjs locale entirely — including anything we put there.
      const state = await new Streami18n({
        logger: () => {},
        translationsForLanguage: {
          'timestamp.StickyHeader':
            '{{ timestamp | timestampFormatter(calendar: true; calendarFormats: {"lastDay":"[Mine: lastDay]", "lastWeek":"dddd", "nextDay":"[Mine: nextDay]", "nextWeek":"dddd", "sameDay":"[Mine: sameDay]", "sameElse":"L"}) }}',
        },
      }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('Mine: sameDay');
      expect(stickyHeader(state, noonOffsetByDays(-1))).toBe('Mine: lastDay');
    });

    it('does not touch a replaced timestampFormatter', async () => {
      const state = await new Streami18n({
        formatters: { timestampFormatter: () => () => 'from my own formatter' },
        logger: () => {},
      }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).toBe('from my own formatter');
    });

    it('survives setLanguage in both directions', async () => {
      const i18n = new Streami18n({ logger: () => {} });
      i18n.registerTranslation(
        'de',
        {},
        {
          calendar: {
            lastDay: '[gestern]',
            lastWeek: 'dddd',
            nextDay: '[morgen]',
            nextWeek: 'dddd [um] LT',
            sameDay: '[heute]',
            sameElse: 'L',
          },
        },
      );
      await i18n.init();

      expect(stickyHeader(i18n.state.getLatestValue(), noonOffsetByDays(0))).toBe('Today');

      await i18n.setLanguage('de');
      expect(stickyHeader(i18n.state.getLatestValue(), noonOffsetByDays(0))).toBe('heute');

      // Back to English: our block is still there, and the German one did not overwrite it.
      await i18n.setLanguage('en');
      expect(stickyHeader(i18n.state.getLatestValue(), noonOffsetByDays(0))).toBe('Today');
    });

    it('does not leak into a language whose dayjs locale carries no calendar config', async () => {
      // No dayjs locale file defines `calendar`, so this app gets the plugin's own English scaffolding
      // around German day names — the case core logs a warning for. The point here is only that the
      // scaffolding is dayjs's and not ours: the SDK's `en` block must not stand in for a missing `de`
      // one, because that would be the SDK forcing English on a translated app.
      const state = await new Streami18n({ language: 'de', logger: () => {} }).init();

      expect(stickyHeader(state, noonOffsetByDays(0))).not.toBe('Today');
      expect(stickyHeader(state, noonOffsetByDays(-1))).not.toBe('Yesterday');
      expect(stickyHeader(state, noonOffsetByDays(-3))).toContain(
        weekdayName(noonOffsetByDays(-3), 'de'),
      );
    });
  });
});
