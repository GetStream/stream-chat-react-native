import { Streami18n } from '../Streami18n';
import uuidv4 from 'uuid/v4';
import { default as originalMoment } from 'moment';
import { nlTranslations, frTranslations } from '../../i18n';
import 'moment/locale/nl';

const customMomentLocaleConfig = {
  months: 'januar_februar_mars_apríl_mai_juni_juli_august_september_oktober_november_desember'.split(
    '_',
  ),
  monthsShort: 'jan_feb_mar_apr_mai_jun_jul_aug_sep_okt_nov_des'.split('_'),
  weekdays: 'sunnudagur_mánadagur_týsdagur_mikudagur_hósdagur_fríggjadagur_leygardagur'.split(
    '_',
  ),
  weekdaysShort: 'sun_mán_týs_mik_hós_frí_ley'.split('_'),
  weekdaysMin: 'su_má_tý_mi_hó_fr_le'.split('_'),
  longDateFormat: {
    LT: 'HH:mm',
    LTS: 'HH:mm:ss',
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd D. MMMM, YYYY HH:mm',
  },
  calendar: {
    sameDay: '[Í dag kl.] LT',
    nextDay: '[Í morgin kl.] LT',
    nextWeek: 'dddd [kl.] LT',
    lastDay: '[Í gjár kl.] LT',
    lastWeek: '[síðstu] dddd [kl] LT',
    sameElse: 'L',
  },
  relativeTime: {
    future: 'um %s',
    past: '%s síðani',
    s: 'fá sekund',
    ss: '%d sekundir',
    m: 'ein minutt',
    mm: '%d minuttir',
    h: 'ein tími',
    hh: '%d tímar',
    d: 'ein dagur',
    dd: '%d dagar',
    M: 'ein mánaði',
    MM: '%d mánaðir',
    y: 'eitt ár',
    yy: '%d ár',
  },
  dayOfMonthOrdinalParse: /\d{1,2}\./,
  ordinal: '%d.',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
};

describe('Streami18n instance - default', () => {
  const streami18nOptions = {};
  const streami18n = new Streami18n(streami18nOptions);

  it('should provide default english translator', async () => {
    const { t: _t } = await streami18n.getTranslators();
    const text = uuidv4();

    expect(_t(text)).toBe(text);
  });

  it('should provide moment with default en locale', async () => {
    const { moment } = await streami18n.getTranslators();
    expect(moment() instanceof originalMoment).toBe(true);
    expect(moment().locale()).toBe('en');
  });
});

describe('Streami18n instance - with built-in langauge', () => {
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
    it('should provide moment with `nl` locale', async () => {
      const { moment } = await streami18n.getTranslators();
      expect(moment() instanceof originalMoment).toBe(true);
      expect(moment().locale()).toBe('nl');
    });
  });

  describe('datetime translations disabled', () => {
    const streami18nOptions = {
      language: 'nl',
      disableDateTimeTranslations: true,
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide dutch translator', async () => {
      const { t: _t } = await streami18n.getTranslators();
      for (const key in nlTranslations) {
        if (key.indexOf('{{') > -1 && key.indexOf('}}') > -1) continue;

        expect(_t(key)).toBe(nlTranslations[key]);
      }
    });

    it('should provide moment with default `en` locale', async () => {
      const { moment } = await streami18n.getTranslators();
      expect(moment() instanceof originalMoment).toBe(true);
      expect(moment().locale()).toBe('en');
    });
  });

  describe('custom momentjs locale config', () => {
    const streami18nOptions = {
      language: 'nl',
      momentLocaleConfigForLanguage: customMomentLocaleConfig,
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide moment with given custom locale config', async () => {
      const { moment } = await streami18n.getTranslators();
      expect(moment() instanceof originalMoment).toBe(true);
      const localeConfig = moment().localeData()['_config'];
      // console.log(streami18nOptions.momentLocaleConfigForLanguage);
      for (const key in streami18nOptions.momentLocaleConfigForLanguage) {
        expect(localeConfig[key]).toStrictEqual(
          streami18nOptions.momentLocaleConfigForLanguage[key],
        );
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
      langauge: 'zh',
      translationsForLanguage: translations,
    };
    const streami18n = new Streami18n(streami18nOptions);

    it('should provide given (chinese in this case) translator', async () => {
      const { t: _t } = await streami18n.getTranslators();

      expect(_t(textKey1)).toBe(textValue1);

      expect(_t(textKey2)).toBe(textValue2);
    });

    it('should provide moment with default `en` locale', async () => {
      const { moment } = await streami18n.getTranslators();
      expect(moment() instanceof originalMoment).toBe(true);
      expect(moment().locale()).toBe('en');
    });
  });
});

describe('registerTranslation - register new language `mr` (Marathi) ', () => {
  const streami18nOptions = {
    language: 'nl',
    disableDateTimeTranslations: false,
  };
  const streami18n = new Streami18n(streami18nOptions);
  const languageCode = 'mr';
  const translations = {
    text1: 'अनुवादित मजकूर 1',
    text2: 'अनुवादित मजकूर 2',
  };
  streami18n.registerTranslation(
    languageCode,
    translations,
    customMomentLocaleConfig,
  );

  it('should add Marathi translations object to list of translations', () => {
    expect(streami18n.getTranslations()).toHaveProperty(languageCode, {
      translation: translations,
    });
  });

  it('should register moment locale config for Marathi translations', async () => {
    const { moment } = await streami18n.getTranslators();
    expect(moment() instanceof originalMoment).toBe(true);
    const localeConfig = moment().localeData()['_config'];
    for (const key in customMomentLocaleConfig) {
      expect(customMomentLocaleConfig[key]).toStrictEqual(localeConfig[key]);
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
