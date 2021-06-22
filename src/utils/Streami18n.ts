import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localeData from 'dayjs/plugin/localeData';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import i18n, { FallbackLng, TFunction } from 'i18next';

import enTranslations from '../i18n/en.json';
import frTranslations from '../i18n/fr.json';
import hiTranslations from '../i18n/hi.json';
import itTranslations from '../i18n/it.json';
import nlTranslations from '../i18n/nl.json';
import ruTranslations from '../i18n/ru.json';
import trTranslations from '../i18n/tr.json';

const defaultNS = 'translation';
const defaultLng = 'en';

import 'dayjs/locale/fr';
import 'dayjs/locale/hi';
import 'dayjs/locale/it';
import 'dayjs/locale/nl';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';

/**
 * These locale imports also set these locales globally.
 * So as a last step we import the english locale to make
 * sure we don't mess up languages in other places in the app.
 */
import 'dayjs/locale/en';

import type moment from 'moment';

import type { TDateTimeParser } from '../contexts/translationContext/TranslationContext';
import type { UnknownType } from '../types/types';

Dayjs.extend(updateLocale);

Dayjs.updateLocale('en', {
  format: {
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm',
    LT: 'hh:mmA',
    LTS: 'HH:mm:ss',
  },
});

Dayjs.updateLocale('nl', {
  calendar: {
    lastDay: '[gisteren om] LT',
    lastWeek: '[afgelopen] dddd [om] LT',
    nextDay: '[morgen om] LT',
    nextWeek: 'dddd [om] LT',
    sameDay: '[vandaag om] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('it', {
  calendar: {
    lastDay: '[Ieri alle] LT',
    lastWeek: '[lo scorso] dddd [alle] LT',
    nextDay: '[Domani alle] LT',
    nextWeek: 'dddd [alle] LT',
    sameDay: '[Oggi alle] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('hi', {
  calendar: {
    lastDay: '[कल] LT',
    lastWeek: '[पिछले] dddd, LT',
    nextDay: '[कल] LT',
    nextWeek: 'dddd, LT',
    sameDay: '[आज] LT',
    sameElse: 'L',
  },

  /**
   * Hindi notation for meridiems are quite fuzzy in practice. While there exists
   * a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
   */
  meridiem(hour: number) {
    if (hour < 4) return 'रात';
    if (hour < 10) return 'सुबह';
    if (hour < 17) return 'दोपहर';
    if (hour < 20) return 'शाम';
    return 'रात';
  },

  meridiemHour(hour: number, meridiem: string) {
    if (hour === 12) {
      hour = 0;
    }
    if (meridiem === 'रात') return hour < 4 ? hour : hour + 12;
    if (meridiem === 'सुबह') return hour;
    if (meridiem === 'दोपहर') return hour >= 10 ? hour : hour + 12;
    if (meridiem === 'शाम') return hour + 12;
    return hour;
  },

  meridiemParse: /रात|सुबह|दोपहर|शाम/,
});

Dayjs.updateLocale('fr', {
  calendar: {
    lastDay: '[Hier à] LT',
    lastWeek: 'dddd [dernier à] LT',
    nextDay: '[Demain à] LT',
    nextWeek: 'dddd [à] LT',
    sameDay: '[Aujourd’hui à] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('tr', {
  calendar: {
    lastDay: '[dün] LT',
    lastWeek: '[geçen] dddd [saat] LT',
    nextDay: '[yarın saat] LT',
    nextWeek: '[gelecek] dddd [saat] LT',
    sameDay: '[bugün saat] LT',
    sameElse: 'L',
  },
});

Dayjs.updateLocale('ru', {
  calendar: {
    lastDay: '[Вчера, в] LT',
    nextDay: '[Завтра, в] LT',
    sameDay: '[Сегодня, в] LT',
  },
});

const en_locale = {
  formats: {},
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  relativeTime: {},
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// Type guards to check DayJs
const isDayJs = (dateTimeParser: typeof Dayjs | typeof moment): dateTimeParser is typeof Dayjs =>
  (dateTimeParser as typeof Dayjs).extend !== undefined;

type Options = {
  DateTimeParser?: typeof Dayjs | typeof moment;
  dayjsLocaleConfigForLanguage?: Partial<ILocale>;
  debug?: boolean;
  disableDateTimeTranslations?: boolean;
  language?: string;
  logger?: (msg?: string) => void;
  translationsForLanguage?: Partial<typeof enTranslations>;
};

type I18NextConfig = {
  debug: boolean;
  fallbackLng: false | FallbackLng;
  interpolation: { escapeValue: boolean };
  keySeparator: false | string;
  lng: string;
  nsSeparator: false | string;
  parseMissingKeyHandler: (key: string) => string;
};

/**
 * Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.
 * Instance of this class should be provided to Chat component to handle translations.
 * Stream provides following list of in-built translations:
 * 1. English (en)
 * 2. Dutch (nl)
 * 3. Russian (ru)
 * 4. Turkish (tr)
 * 5. French (fr)
 * 6. Italian (it)
 * 7. Hindi (hi)
 *
 * Simplest way to start using chat components in one of the in-built languages would be following:
 *
 * ```
 * const i18n = new Streami18n({ language 'nl' });
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * If you would like to override certain keys in in-built translation.
 * UI will be automatically updated in this case.
 *
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  translationsForLanguage: {
 *    'Nothing yet...': 'Nog Niet ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 *  }
 * });
 *
 * If you would like to register additional languages, use registerTranslation. You can add as many languages as you want:
 *
 * i18n.registerTranslation('zh', {
 *  'Nothing yet...': 'Nog Niet ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 * });
 *
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * You can use the same function to add whole new language as well.
 *
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation('mr', {
 *  'Nothing yet...': 'काहीही नाही  ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
 * });
 *
 * // Make sure to call setLanguage to reflect new language in UI.
 * i18n.setLanguage('it');
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * ## Datetime translations
 *
 * Stream react chat components uses [dayjs](https://day.js.org/en/) internally by default to format datetime stamp.
 * e.g., in ChannelPreview, MessageContent components.
 * Dayjs has locale support as well - https://day.js.org/docs/en/i18n/i18n
 * Dayjs is a lightweight alternative to Momentjs with the same modern API.
 *
 * Dayjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
 * https://github.com/iamkun/dayjs/tree/dev/src/locale
 *
 * You can either provide the dayjs locale config while registering
 * language with Streami18n (either via constructor or registerTranslation()) or you can provide your own Dayjs or Moment instance
 * to Streami18n constructor, which will be then used internally (using the language locale) in components.
 *
 * 1. Via language registration
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  dayjsLocaleConfigForLanguage: {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * });
 * ```
 *
 * Similarly, you can add locale config for moment while registering translation via `registerTranslation` function.
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation(
 *  'mr',
 *  {
 *    'Nothing yet...': 'काहीही नाही  ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
 *  },
 *  {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * );
 *```
 * 2. Provide your own Moment object
 *
 * ```js
 * import 'moment/locale/nl';
 * import 'moment/locale/it';
 * // or if you want to include all locales
 * import 'moment/min/locales';
 *
 * import Moment from moment
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Moment
 * })
 * ```
 *
 * 3. Provide your own Dayjs object
 *
 * ```js
 * import Dayjs from 'dayjs'
 *
 * import 'dayjs/locale/nl';
 * import 'dayjs/locale/it';
 * // or if you want to include all locales
 * import 'dayjs/min/locales';
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Dayjs
 * })
 * ```
 * If you would like to stick with english language for date-times in Stream components, you can set `disableDateTimeTranslations` to true.
 *
 */
const defaultStreami18nOptions = {
  DateTimeParser: Dayjs,
  dayjsLocaleConfigForLanguage: null,
  debug: false,
  disableDateTimeTranslations: false,
  language: 'en',
  logger: (msg?: string) => console.warn(msg),
};

export class Streami18n {
  i18nInstance = i18n.createInstance();
  Dayjs = null;
  setLanguageCallback: (t: TFunction) => void = () => null;
  initialized = false;

  t: TFunction = (key: string) => key;
  tDateTimeParser: TDateTimeParser;

  translations: {
    [key: string]: {
      [key: string]: Partial<typeof enTranslations> | UnknownType;
    };
  } = {
    en: { [defaultNS]: enTranslations },
    fr: { [defaultNS]: frTranslations },
    hi: { [defaultNS]: hiTranslations },
    it: { [defaultNS]: itTranslations },
    nl: { [defaultNS]: nlTranslations },
    ru: { [defaultNS]: ruTranslations },
    tr: { [defaultNS]: trTranslations },
  };

  /**
   * dayjs.defineLanguage('nl') also changes the global locale. We don't want to do that
   * when a user calls the registerTranslation() function. So instead we will store the
   * locale configs given to the registerTranslation() function in `dayjsLocales` object,
   * and register the required locale with moment when setLanguage is called.
   */
  dayjsLocales: { [key: string]: Partial<ILocale> } = {};

  /**
   * Initialize properties used in constructor
   */
  logger: (msg?: string) => void;
  currentLanguage: string;
  DateTimeParser: typeof Dayjs | typeof moment;
  isCustomDateTimeParser: boolean;
  i18nextConfig: I18NextConfig;

  /**
   * Constructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object. Please check src/i18n/en.json for example.
   *
   *  - disableDateTimeTranslations (boolean) default: false
   *    Disable translations for date-times
   *
   *  - debug (boolean) default: false
   *    Enable debug mode in internal i18n class
   *
   *  - logger (function) default: () => {}
   *    Logger function to log warnings/errors from this class
   *
   *  - dayjsLocaleConfigForLanguage (object) default: 'enConfig'
   *    [Config object](https://momentjs.com/docs/#/i18n/changing-locale/) for internal moment object,
   *    corresponding to language (param)
   *
   *  - DateTimeParser (function) Moment or Dayjs instance/function.
   *    Make sure to load all the required locales in this Moment or Dayjs instance that you will be provide to Streami18n
   *
   * @param {*} options
   */
  constructor(options: Options = {}, i18nextConfig: Partial<I18NextConfig> = {}) {
    const finalOptions = {
      ...defaultStreami18nOptions,
      ...options,
    };

    // Prepare the i18next configuration.
    this.logger = finalOptions.logger;

    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;

    try {
      /**
       * This is a shallow check to see if the given parser is an instance of Dayjs.
       * For some reason Dayjs.isDayjs(this.DateTimeParser()) doesn't work.
       */
      if (this.DateTimeParser && isDayJs(this.DateTimeParser)) {
        this.DateTimeParser.extend(LocalizedFormat);
        this.DateTimeParser.extend(calendar);
        this.DateTimeParser.extend(localeData);
        this.DateTimeParser.extend(relativeTime);
      }
    } catch (error) {
      throw new Error(
        `Streami18n: Looks like you wanted to provide a Dayjs instance but something went wrong while adding plugins ${JSON.stringify(
          error,
        )}`,
      );
    }

    this.isCustomDateTimeParser = !!options.DateTimeParser;
    const translationsForLanguage = finalOptions.translationsForLanguage;

    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]:
          this.translations[this.currentLanguage] &&
          this.translations[this.currentLanguage][defaultNS]
            ? {
                ...this.translations[this.currentLanguage][defaultNS],
                ...translationsForLanguage,
              }
            : translationsForLanguage,
      };
    }

    // If translations don't exist for given language, then set it as empty object.
    if (!this.translations[this.currentLanguage]) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: {},
      };
    }

    this.i18nextConfig = {
      debug: finalOptions.debug,
      fallbackLng: false,
      interpolation: { escapeValue: false },
      keySeparator: false,
      lng: this.currentLanguage,
      nsSeparator: false,

      parseMissingKeyHandler: (key: string) => {
        this.logger(`Streami18n: Missing translation for key: ${key}`);

        return key;
      },
      ...i18nextConfig,
    };

    this.validateCurrentLanguage();

    const dayjsLocaleConfigForLanguage = finalOptions.dayjsLocaleConfigForLanguage;

    if (dayjsLocaleConfigForLanguage) {
      this.addOrUpdateLocale(this.currentLanguage, {
        ...dayjsLocaleConfigForLanguage,
      });
    } else if (!this.localeExists(this.currentLanguage)) {
      this.logger(
        `Streami18n: Streami18n(...) - Locale config for ${this.currentLanguage} does not exist in momentjs.` +
          `Please import the locale file using "import 'moment/locale/${this.currentLanguage}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    this.tDateTimeParser = (timestamp) => {
      if (finalOptions.disableDateTimeTranslations || !this.localeExists(this.currentLanguage)) {
        /**
         * TS needs to know which is being called to accept the chain call
         */
        if (isDayJs(this.DateTimeParser)) {
          return this.DateTimeParser(timestamp).locale(defaultLng);
        }
        return this.DateTimeParser(timestamp).locale(defaultLng);
      }
      if (isDayJs(this.DateTimeParser)) {
        return this.DateTimeParser(timestamp).locale(this.currentLanguage);
      }
      return this.DateTimeParser(timestamp).locale(this.currentLanguage);
    };
  }

  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */
  async init() {
    this.validateCurrentLanguage();

    try {
      this.t = await this.i18nInstance.init({
        ...this.i18nextConfig,
        lng: this.currentLanguage,
        resources: this.translations,
      });
      this.initialized = true;
    } catch (error) {
      this.logger(`Something went wrong with init: ${JSON.stringify(error)}`);
    }

    return {
      t: this.t,
      tDateTimeParser: this.tDateTimeParser,
    };
  }

  localeExists = (language: string) => {
    if (this.isCustomDateTimeParser) return true;

    return Object.keys(Dayjs.Ls).indexOf(language) > -1;
  };

  validateCurrentLanguage = () => {
    const availableLanguages = Object.keys(this.translations);
    if (availableLanguages.indexOf(this.currentLanguage) === -1) {
      this.logger(
        `Streami18n: '${this.currentLanguage}' language is not registered.` +
          ` Please make sure to call streami18n.registerTranslation('${this.currentLanguage}', {...}) or ` +
          `use one the built-in supported languages - ${this.getAvailableLanguages()}`,
      );

      this.currentLanguage = defaultLng;
    }
  };

  /** Returns an instance of i18next used within this class instance */
  geti18Instance = () => this.i18nInstance;

  /** Returns list of available languages. */
  getAvailableLanguages = () => Object.keys(this.translations);

  /** Returns all the translation dictionary for all inbuilt-languages */
  getTranslations = () => this.translations;

  /**
   * Returns current version translator function.
   */
  async getTranslators() {
    if (!this.initialized) {
      if (this.dayjsLocales[this.currentLanguage]) {
        this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
      }
      return await this.init();
    } else {
      return {
        t: this.t,
        tDateTimeParser: this.tDateTimeParser,
      };
    }
  }

  /**
   * Register translation
   */
  registerTranslation(
    language: string,
    translation: Partial<typeof enTranslations> | UnknownType,
    customDayjsLocale?: Partial<ILocale>,
  ) {
    if (!translation) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customDayjsLocale) called without translation`,
      );
      return;
    }

    if (!this.translations[language]) {
      this.translations[language] = { [defaultNS]: translation };
    } else {
      this.translations[language][defaultNS] = translation;
    }

    if (customDayjsLocale) {
      this.dayjsLocales[language] = { ...customDayjsLocale };
    } else if (!this.localeExists(language)) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customDayjsLocale) - ` +
          `Locale config for ${language} does not exist in Dayjs.` +
          `Please import the locale file using "import 'dayjs/locale/${language}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)`,
      );
    }

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  }

  addOrUpdateLocale(key: string, config: Partial<ILocale>) {
    if (this.localeExists(key)) {
      Dayjs.updateLocale(key, { ...config });
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      Dayjs.locale({ name: key, ...en_locale, ...config }, undefined, true);
    }
  }

  /**
   * Changes the language.
   */
  async setLanguage(language: string) {
    this.currentLanguage = language;

    if (!this.initialized) return;

    try {
      const t = await this.i18nInstance.changeLanguage(language);
      if (this.dayjsLocales[language]) {
        this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
      }
      this.setLanguageCallback(t);

      return t;
    } catch (error) {
      this.logger(`Failed to set language: ${JSON.stringify(error)}`);
      return this.t;
    }
  }

  registerSetLanguageCallback(callback: (t: TFunction) => void) {
    this.setLanguageCallback = callback;
  }
}
