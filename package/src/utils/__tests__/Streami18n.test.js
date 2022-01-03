import { default as Dayjs } from 'dayjs';
import 'dayjs/locale/nl';
import localeData from 'dayjs/plugin/localeData';

import frTranslations from '../../i18n/fr.json';
import nlTranslations from '../../i18n/nl.json';
import { Streami18n } from '../Streami18n';

Dayjs.extend(localeData);

const customDayjsLocaleConfig = {
  months:
    'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split('_'),
  monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
  ordinal: '%d.',
  weekdays: 'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split('_'),
  weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
  weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
};

describe('Streami18n instance - default', () => {
  const streami18nOptions = { logger: () => {} };
  const streami18n = new Streami18n(streami18nOptions);

  it('should provide default english translator', async () => {
    const { t: _t } = await streami18n.getTranslators();
    const text = Date.now().toString();

    expect(_t(text)).toBe(text);
  });

  it('should provide dayjs with default en locale', async () => {
    const { tDateTimeParser } = await streami18n.getTranslators();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);
    expect(tDateTimeParser().locale()).toBe('en');
  });
});

describe('Streami18n instance - with built-in language', () => {
  describe('datetime translations enabled', () => {
    const streami18nOptions = { language: 'nl' };
    const streami18n = new Streami18n(streami18nOptions);
    it('should provide dutch translator', async () => {
      const { t: _t } = await streami18n.getTranslators();
      for (const key in nlTranslations) {
        if (key.indexOf('{{') > -1 && key.indexOf('}}') > -1) continue;

        expect(_t(key)).toBe(nlTranslations[key]);
      }
    });
    it('should provide dayjs with `nl` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect(tDateTimeParser().locale()).toBe('nl');
    });
  });

  describe('datetime translations disabled', () => {
    const streami18nOptions = {
      disableDateTimeTranslations: true,
      language: 'nl',
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide dutch translator', async () => {
      const { t: _t } = await streami18n.getTranslators();
      for (const key in nlTranslations) {
        if (key.indexOf('{{') > -1 && key.indexOf('}}') > -1) continue;

        expect(_t(key)).toBe(nlTranslations[key]);
      }
    });

    it('should provide dayjs with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect(tDateTimeParser().locale()).toBe('en');
    });
  });

  describe('custom dayjs locale config', () => {
    const streami18nOptions = {
      dayjsLocaleConfigForLanguage: customDayjsLocaleConfig,
      language: 'nl',
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide dayjs with given custom locale config', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      const localeConfig = tDateTimeParser().localeData();
      for (const key in streami18nOptions.dayjsLocaleConfigForLanguage) {
        if (typeof localeConfig[key] === 'function') {
          expect(localeConfig[key]()).toStrictEqual(customDayjsLocaleConfig[key]);
        } else {
          expect(localeConfig[key]).toStrictEqual(customDayjsLocaleConfig[key]);
        }
      }
    });
  });
});

describe('Streami18n instance - with custom translations', () => {
  describe('datetime translations enabled', () => {
    const textKey1 = 'this is text one';
    const textValue1 = '这是文字一';
    const textKey2 = 'this is text two';
    const textValue2 = '这是文字二';
    const translations = {
      [textKey1]: textValue1,
      [textKey2]: textValue2,
    };
    const streami18nOptions = {
      language: 'zh',
      translationsForLanguage: translations,
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide given (chinese in this case) translator', async () => {
      const { t: _t } = await streami18n.getTranslators();

      expect(_t(textKey1)).toBe(textValue1);

      expect(_t(textKey2)).toBe(textValue2);
    });

    it('should provide dayjs with default `en` locale', async () => {
      const { tDateTimeParser } = await streami18n.getTranslators();
      expect(tDateTimeParser() instanceof Dayjs).toBe(true);
      expect(tDateTimeParser().locale()).toBe('en');
    });
  });
});

describe('registerTranslation - register new language `mr` (Marathi)', () => {
  const streami18nOptions = {
    disableDateTimeTranslations: false,
    language: 'en',
  };
  const streami18n = new Streami18n(streami18nOptions);
  const languageCode = 'mr';
  const translations = {
    text1: 'अनुवादित मजकूर 1',
    text2: 'अनुवादित मजकूर 2',
  };
  streami18n.registerTranslation(languageCode, translations, customDayjsLocaleConfig);

  streami18n.setLanguage('mr');

  it('should add Marathi translations object to list of translations', () => {
    expect(streami18n.getTranslations()).toHaveProperty(languageCode, {
      translation: translations,
    });
  });

  it('should register dayjs locale config for Marathi translations', async () => {
    const { tDateTimeParser } = await streami18n.getTranslators();
    expect(tDateTimeParser() instanceof Dayjs).toBe(true);

    const localeConfig = tDateTimeParser().localeData();
    for (const key in customDayjsLocaleConfig) {
      if (typeof localeConfig[key] === 'function') {
        expect(localeConfig[key]()).toStrictEqual(customDayjsLocaleConfig[key]);
      } else {
        expect(localeConfig[key]).toStrictEqual(customDayjsLocaleConfig[key]);
      }
    }
  });
});

describe('setLanguage - switch to french', () => {
  const streami18nOptions = {};
  const streami18n = new Streami18n(streami18nOptions);

  it('should provide french translator', async () => {
    await streami18n.setLanguage('fr');

    const { t: _t } = await streami18n.getTranslators();
    for (const key in frTranslations) {
      if (key.indexOf('{{') > -1 && key.indexOf('}}') > -1) continue;

      expect(_t(key)).toBe(frTranslations[key]);
    }
  });
});
