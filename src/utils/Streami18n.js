import i18n from 'i18next';
import Moment from 'moment';
import {
  enTranslations,
  nlTranslations,
  ruTranslations,
  trTranslations,
  frTranslations,
  hiTranslations,
  itTranslations,
  esTranslations,
} from '../i18n';

import 'moment/locale/nl';
import 'moment/locale/it';
import 'moment/locale/ru';
import 'moment/locale/tr';
import 'moment/locale/fr';
import 'moment/locale/hi';
import 'moment/locale/es';

const defaultNS = 'translation';
const defaultLng = 'en';
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
 * Stream components uses [momentjs](http://momentjs.com/) internally to format datetime stamp.
 * e.g., in ChannelPreview, MessageContent components.
 *
 * When you use any of the built-in translations, datetime will also be translated in corresponding langauge
 * by default. If you would like to stick with english language for datetimes, you can set `disableDateTimeTranslations` to true.
 *
 * You can override the locale config for momentjs.
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  momentLocaleConfigForLanguage: {
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
 */
const defaultStreami18nOptions = {
  language: 'en',
  disableDateTimeTranslations: false,
  debug: false,
  logger: () => {},
  momentLocaleConfigForLanguage: null,
};
export class Streami18n {
  i18nInstance = i18n.createInstance();
  momentInstance = null;
  setLanguageCallback = () => null;
  initialized = false;
  t = null;
  translations = {
    en: { [defaultNS]: enTranslations },
    nl: { [defaultNS]: nlTranslations },
    ru: { [defaultNS]: ruTranslations },
    tr: { [defaultNS]: trTranslations },
    fr: { [defaultNS]: frTranslations },
    hi: { [defaultNS]: hiTranslations },
    it: { [defaultNS]: itTranslations },
    es: { [defaultNS]: esTranslations },
  };

  /**
   * Contructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - disableDateTimeTranslations (boolean) default: false
   *    Disable translations for datetimes
   *
   *  - debug (boolean) default: false
   *    Enable debug mode in internal i18n class
   *
   *  - logger (function) default: () => {}
   *    Logger function to log warnings/errors from this class
   *
   *  - momentLocaleConfigForLanguage (object) default: 'enConfig'
   *    [Config object](https://momentjs.com/docs/#/i18n/changing-locale/) for internal moment object,
   *    corresponding to language (param)
   *
   * @param {*} options
   */
  constructor(options = {}) {
    const finalOptions = {
      ...defaultStreami18nOptions,
      ...options,
    };
    this.currentLanguage = finalOptions.language;
    const translationsForLanguage = finalOptions.translationsForLanguage;
    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: translationsForLanguage,
      };
    }

    const momentLocaleConfigForLanguage =
      finalOptions.momentLocaleConfigForLanguage;

    this.logger = finalOptions.logger;
    this.i18nextConfig = {
      nsSeparator: false,
      keySeparator: false,
      fallbackLng: false,
      debug: finalOptions.debug,
      lng: this.currentLanguage,
      parseMissingKeyHandler: (key) => {
        this.logger(`Missing translation for key: ${key}`);

        return key;
      },
    };

    this.validateCurrentLanguage(this.currentLanguage);

    if (momentLocaleConfigForLanguage) {
      this.addOrUpdateMomentLocaleConfig(
        this.currentLanguage,
        momentLocaleConfigForLanguage,
      );
    }

    this.momentInstance = (timestamp) => {
      if (finalOptions.disableDateTimeTranslations) {
        return Moment(timestamp).locale(defaultLng);
      }

      if (this.momentLocaleExists(this.currentLanguage)) {
        return Moment(timestamp).locale(this.currentLanguage);
      }

      console.warn(
        `Locale config for ${this.currentLanguage} does not exist in momentjs.`,
      );
      return Moment(timestamp).locale(defaultLng);
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
        resources: this.translations,
        lng: this.currentLanguage,
      });
      this.initialized = true;

      return {
        t: this.t,
        moment: this.momentInstance,
      };
    } catch (e) {
      this.logger(`Something went wrong with init:`, e);
    }
  }

  momentLocaleExists = (language) => {
    const locales = Moment.locales();
    return locales.indexOf(language) > -1;
  };

  validateCurrentLanguage = () => {
    const availableLanguages = Object.keys(this.translations);
    if (availableLanguages.indexOf(this.currentLanguage) === -1) {
      console.warn(
        `'${this.currentLanguage}' language is not registered.` +
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
      return await this.init();
    } else {
      return {
        t: this.t,
        moment: this.momentInstance,
      };
    }
  }

  /**
   *
   * @param {*} key
   * @param {*} translation
   * @param {*} customMomentLocale
   */
  registerTranslation(key, translation, customMomentLocale) {
    if (!this.translations[key]) {
      this.translations[key] = { [defaultNS]: translation };
    } else {
      this.translations[key][defaultNS] = translation;
    }

    if (customMomentLocale) {
      this.addOrUpdateMomentLocaleConfig(key, { ...customMomentLocale });
    }

    if (this.initialized) {
      this.i18nInstance.addResources(key, defaultNS, translation);
    }
  }

  addOrUpdateMomentLocaleConfig(key, config) {
    if (this.momentLocaleExists(key)) {
      Moment.updateLocale(key, config);
    } else {
      Moment.defineLocale(key, config);
    }
  }
  /**
   *
   * @param {*} language
   */
  async setLanguage(language) {
    this.currentLanguage = language;

    if (!this.initialized) return;

    try {
      const t = await this.i18nInstance.changeLanguage(language);
      this.setLanguageCallback(t);
      return t;
    } catch (e) {
      this.logger(`Failed to set language:`, e);
    }
  }

  /**
   *
   * @param {*} callback
   */
  registerSetLanguageCallback(callback) {
    this.setLanguageCallback = callback;
  }
}
