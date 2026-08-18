import { default as Dayjs } from 'dayjs';
import 'dayjs/locale/nl';
import localeData from 'dayjs/plugin/localeData';
import moment, { type Moment } from 'moment-timezone';

import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type { StreamTFunction, TranslationDictionary } from '../../i18n/types';
import { asDynamicKey } from '../../i18n/utils';
import { Streami18n } from '../i18n/Streami18n';

Dayjs.extend(localeData);

const silent = { logger: () => {} };

const customDayjsLocaleConfig = {
  months:
    'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
  monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
  ordinal: '%d.',
  weekdays: 'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split('_'),
  weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
  weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
};

/**
 * No locale but English ships any more, so proving that "a language resolves" means registering a
 * dictionary — exactly what an integrator does. Deliberately partial: the keys left out are what
 * prove the inline-English fallback, and the plural pair is what proves `count` still selects
 * against the registered language's own `Intl.PluralRules` categories rather than English's.
 */
const nlDictionary: TranslationDictionary = {
  'attachment.unsupported.title': 'Niet-ondersteunde bijlage',
  'autoCompleteInput.placeholder': 'Stuur een bericht',
  'channelDetails.memberSection.title_one': '{{count}} lid',
  'channelDetails.memberSection.title_other': '{{count}} leden',
  'common.cancel.label': 'Annuleren',
};

/** The plural call site's arguments, copied from `ChannelDetailsMemberSection`. */
const memberSectionPluralOptions = (count: number) => ({
  count,
  defaultValue_one: '{{count}} member',
  defaultValue_other: '{{count}} members',
});

const expectDutchDictionaryResolves = (t: StreamTFunction) => {
  expect(t('common.cancel.label', 'Cancel')).toBe('Annuleren');
  expect(t('autoCompleteInput.placeholder', 'Send a message')).toBe('Stuur een bericht');
  expect(t('attachment.unsupported.title', 'Unsupported Attachment')).toBe(
    'Niet-ondersteunde bijlage',
  );

  expect(t('channelDetails.memberSection.title', memberSectionPluralOptions(1))).toBe('1 lid');
  expect(t('channelDetails.memberSection.title', memberSectionPluralOptions(4))).toBe('4 leden');

  // Not supplied by the dictionary: renders the inline English default, never a dotted path.
  expect(t('common.loading.text', 'Loading...')).toBe('Loading...');
};

describe('Jest Timezone', () => {
  it('global config should set the timezone to UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

describe('Streami18n instance - default', () => {
  const streami18n = new Streami18n(silent);

  it('should render english copy from the inline defaults', async () => {
    const { t: _t } = await streami18n.init();

    expect(_t('common.cancel.label', 'Cancel')).toBe('Cancel');
    expect(_t('channelDetails.memberSection.title', memberSectionPluralOptions(2))).toBe(
      '2 members',
    );
  });

  it('should echo back a key it has no translation for', async () => {
    const { t: _t } = await streami18n.init();
    // A key only known at runtime, with no bundled value and no inline default — the one case where
    // rendering the key itself is the correct outcome.
    const text = Date.now().toString();

    expect(_t(asDynamicKey(text))).toBe(text);
  });

  it('should provide dayjs with default en locale', async () => {
    const { tDateTimeParser } = await streami18n.init();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);
    expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
  });
});

describe('Streami18n instance - with a registered language', () => {
  describe('datetime translations enabled', () => {
    const streami18n = new Streami18n({
      ...silent,
      language: 'nl',
      translationsForLanguage: nlDictionary,
    });

    it('should provide dutch translator', async () => {
      const { t: _t } = await streami18n.init();
      expectDutchDictionaryResolves(_t);
    });

    it('should provide dayjs with `nl` locale', async () => {
      const { tDateTimeParser } = await streami18n.init();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('nl');
    });
  });

  describe('datetime translations disabled', () => {
    const streami18n = new Streami18n({
      ...silent,
      disableDateTimeTranslations: true,
      language: 'nl',
      translationsForLanguage: nlDictionary,
    });

    it('should provide dutch translator', async () => {
      const { t: _t } = await streami18n.init();
      expectDutchDictionaryResolves(_t);
    });

    it('should provide dayjs with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.init();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
    });
  });

  describe('custom dayjs locale config', () => {
    const streami18nOptions = {
      dayjsLocaleConfigForLanguage: customDayjsLocaleConfig,
      language: 'nl',
      translationsForLanguage: nlDictionary,
    };
    const streami18n = new Streami18n(
      streami18nOptions as unknown as ConstructorParameters<typeof Streami18n>[0],
    );

    it('should provide dayjs with given custom locale config', async () => {
      const { tDateTimeParser } = await streami18n.init();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      const localeConfig = (tDateTimeParser() as Dayjs.Dayjs).localeData() as unknown as Record<
        string,
        unknown
      >;
      for (const key in streami18nOptions.dayjsLocaleConfigForLanguage) {
        if (typeof localeConfig[key] === 'function') {
          expect((localeConfig[key] as () => unknown)()).toStrictEqual(
            customDayjsLocaleConfig[key as keyof typeof customDayjsLocaleConfig],
          );
        } else {
          expect(localeConfig[key]).toStrictEqual(
            customDayjsLocaleConfig[key as keyof typeof customDayjsLocaleConfig],
          );
        }
      }
    });
  });
});

describe('Streami18n instance - with custom translations', () => {
  describe('datetime translations enabled', () => {
    const translations: TranslationDictionary = {
      'attachment.unsupported.title': '不支持的附件',
      'common.cancel.label': '取消',
    };
    const streami18n = new Streami18n({
      ...silent,
      language: 'zh',
      translationsForLanguage: translations,
    });

    it('should provide given (chinese in this case) translator', async () => {
      const { t: _t } = await streami18n.init();

      expect(_t('common.cancel.label', 'Cancel')).toBe('取消');
      expect(_t('attachment.unsupported.title', 'Unsupported Attachment')).toBe('不支持的附件');
      expect(_t('common.loading.text', 'Loading...')).toBe('Loading...');
    });

    it('should provide dayjs with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.init();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect((tDateTimeParser() as Dayjs.Dayjs).locale()).toBe('en');
    });
  });
});

describe('registerTranslation - register new language `mr` (Marathi)', () => {
  const streami18nOptions = {
    ...silent,
    disableDateTimeTranslations: false,
    language: 'en',
  };
  const streami18n = new Streami18n(streami18nOptions);
  const languageCode = 'mr';
  const translations: TranslationDictionary = {
    'common.cancel.label': 'रद्द करा',
    'common.loading.text': 'लोड करत आहे...',
  };
  streami18n.registerTranslation(
    languageCode,
    translations,
    customDayjsLocaleConfig as unknown as Parameters<typeof streami18n.registerTranslation>[2],
  );

  streami18n.setLanguage('mr');

  it('should add Marathi translations object to list of translations', () => {
    expect(streami18n.getTranslations()).toHaveProperty(languageCode, {
      // `runtimeDefaults` is layered under every language and `registerTranslation` merges over
      // it, so the registered dictionary is a subset of the resulting bundle rather than all of it.
      // The layering itself is covered by `Streami18nGuarantees.test.ts`.
      translation: expect.objectContaining(translations),
    });
  });

  it('should list Marathi as an available language', () => {
    expect(streami18n.getAvailableLanguages()).toContain(languageCode);
  });

  it('should resolve the registered Marathi dictionary once initialized', async () => {
    // `registerTranslation` + `setLanguage` both ran before `init()`, so this also covers the
    // pre-initialization path into i18next's resource store.
    const { t: _t } = await streami18n.init();

    expect(_t('common.cancel.label', 'Cancel')).toBe('रद्द करा');
    expect(_t('common.loading.text', 'Loading...')).toBe('लोड करत आहे...');
    expect(_t('autoCompleteInput.placeholder', 'Send a message')).toBe('Send a message');
  });

  it('should register dayjs locale config for Marathi translations', async () => {
    const { tDateTimeParser } = await streami18n.init();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);

    const localeConfig = (tDateTimeParser() as Dayjs.Dayjs).localeData() as unknown as Record<
      string,
      unknown
    >;
    for (const key in customDayjsLocaleConfig) {
      if (typeof localeConfig[key] === 'function') {
        expect((localeConfig[key] as () => unknown)()).toStrictEqual(
          customDayjsLocaleConfig[key as keyof typeof customDayjsLocaleConfig],
        );
      } else {
        expect(localeConfig[key]).toStrictEqual(
          customDayjsLocaleConfig[key as keyof typeof customDayjsLocaleConfig],
        );
      }
    }
  });
});

describe('setLanguage - switch to french', () => {
  const frDictionary: TranslationDictionary = {
    'channelDetails.memberSection.title_one': '{{count}} membre',
    'channelDetails.memberSection.title_other': '{{count}} membres',
    'common.cancel.label': 'Annuler',
  };

  const initializedInstance = async () => {
    const streami18n = new Streami18n(silent);
    streami18n.registerTranslation('fr', frDictionary);
    // Initialize on `en` first, so the switch goes through `i18nInstance.changeLanguage`.
    await streami18n.init();
    return streami18n;
  };

  it('should provide french translator', async () => {
    const streami18n = await initializedInstance();
    await streami18n.setLanguage('fr');

    const { t: _t } = await streami18n.init();

    expect(streami18n.currentLanguage).toBe('fr');
    expect(_t('common.cancel.label', 'Cancel')).toBe('Annuler');
    expect(_t('channelDetails.memberSection.title', memberSectionPluralOptions(1))).toBe(
      '1 membre',
    );
    expect(_t('channelDetails.memberSection.title', memberSectionPluralOptions(3))).toBe(
      '3 membres',
    );
    // Not supplied by the french dictionary: the inline English default, not a dotted path.
    expect(_t('common.loading.text', 'Loading...')).toBe('Loading...');
  });

  it('should return to english copy when switching back', async () => {
    const streami18n = await initializedInstance();
    await streami18n.setLanguage('fr');
    await streami18n.setLanguage('en');

    const { t: _t } = await streami18n.init();

    expect(streami18n.currentLanguage).toBe('en');
    expect(_t('common.cancel.label', 'Cancel')).toBe('Cancel');
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

describe('Streami18n timezone', () => {
  describe.each([['moment', moment]])('%s', (moduleName, module) => {
    it('is by default the local timezone', () => {
      const streami18n = new Streami18n({ DateTimeParser: module });
      const date = new Date();
      expect((streami18n.tDateTimeParser(date) as Moment).format('H')).toBe(
        date.getHours().toString(),
      );
    });

    it('can be set to different timezone on init', () => {
      const streami18n = new Streami18n({ DateTimeParser: module, timezone: 'Europe/Prague' });
      const date = new Date();
      expect((streami18n.tDateTimeParser(date) as Moment).format('H')).not.toBe(
        date.getHours().toString(),
      );
      expect((streami18n.tDateTimeParser(date) as Moment).format('H')).not.toBe(
        (date.getUTCHours() - 2).toString(),
      );
    });

    it('is ignored if datetime parser does not support timezones', () => {
      const mutableModule = module as unknown as { tz: unknown };
      const tz = mutableModule.tz;
      delete (mutableModule as { tz?: unknown }).tz;

      const streami18n = new Streami18n({ DateTimeParser: module, timezone: 'Europe/Prague' });
      const date = new Date();
      expect((streami18n.tDateTimeParser(date) as Moment).format('H')).toBe(
        date.getHours().toString(),
      );

      mutableModule.tz = tz;
    });
    describe('formatters property', () => {
      it('contains the default timestampFormatter', () => {
        expect(new Streami18n().formatters.timestampFormatter).toBeDefined();
      });
      it('allows to override the default timestampFormatter', async () => {
        const i18n = new Streami18n({
          ...silent,
          formatters: { timestampFormatter: () => () => 'custom' },
          translationsForLanguage: {
            'timestamp.MessageTimestamp': '{{ value | timestampFormatter }}',
          },
        });
        await i18n.init();
        // `value` has to be supplied: since i18next 26 an interpolation whose value is missing or
        // `undefined` short-circuits before the formatter runs. Every SDK call site passes one
        // (`timestamp` for timestampFormatter, `milliseconds` for durationFormatter), so this
        // matches the real path — previously the assertion passed only by accident.
        expect(i18n.t('timestamp.MessageTimestamp', { value: new Date() })).toBe('custom');
      });
      it('allows to add new custom formatter', async () => {
        const i18n = new Streami18n({
          ...silent,
          formatters: { customFormatter: () => () => 'custom' },
          translationsForLanguage: {
            'timestamp.MessageTimestamp': '{{ value | customFormatter }}',
          },
        });
        await i18n.init();
        expect(i18n.t('timestamp.MessageTimestamp', { value: new Date() })).toBe('custom');
      });
    });
  });
});
