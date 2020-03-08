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
} from '../i18n';

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
 * Stream components uses [momentjs](http://momentjs.com/) internally to format datetime stamp. e.g., in ChannelPreview, MessageContent components.
 * Momentjs has locale support as well -https://momentjs.com/docs/#/i18n/
 *
 * Momentjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
 * https://github.com/moment/moment/tree/develop/locale
 *
 * You can either configure locale for moment globally or you can provide the locale config while registering
 * language with Streami18n (either via constructor or registerTranslation())
 *
 * 1. Via import
 * Easiest way to register a locale with momentjs is via import in your app.
 *
 * ```js
 * import 'moment/locale/nl';
 * import 'moment/locale/it';
 * ```
 *
 * 2. Via language registration
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
 * If you would like to stick with english language for datetimes in Stream compoments, you can set `disableDateTimeTranslations` to true.
 *
 */
const defaultStreami18nOptions = {
  language: 'en',
  disableDateTimeTranslations: false,
  debug: false,
  logger: (msg) => console.warn(msg),
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
  };
  /**
   * moment.defineLanguage('nl') also changes the global locale. We don't want to do that
   * when user calls registerTranslation() function. So intead we will store the locale configs
   * given to registerTranslation() function in `momentLocales` object, and register the required locale
   * with moment, when setLanguage is called.
   * */
  momentLocales = {};
  /**
   * Contructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object. Please check src/i18n/en.json for example.
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

    this.logger = finalOptions.logger;
    this.i18nextConfig = {
      nsSeparator: false,
      keySeparator: false,
      fallbackLng: false,
      debug: finalOptions.debug,
      lng: this.currentLanguage,
      parseMissingKeyHandler: (key) => {
        this.logger(`Streami18n: Missing translation for key: ${key}`);

        return key;
      },
    };

    this.validateCurrentLanguage(this.currentLanguage);

    const momentLocaleConfigForLanguage =
      finalOptions.momentLocaleConfigForLanguage;

    if (momentLocaleConfigForLanguage) {
      this.addOrUpdateMomentLocaleConfig(this.currentLanguage, {
        ...momentLocaleConfigForLanguage,
      });
    } else if (!this.momentLocaleExists(this.currentLanguage)) {
      this.logger(
        `Streami18n: Streami18n(...) - Locale config for ${this.currentLanguage} does not exist in momentjs.` +
          `Please import the locale file using "import 'moment/locale/${this.currentLanguage}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customMomentLocale)`,
      );
    }

    this.momentInstance = (timestamp) => {
      if (finalOptions.disableDateTimeTranslations) {
        return Moment(timestamp).locale(defaultLng);
      }

      return Moment(timestamp).locale(this.currentLanguage);
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
      return await this.init();
    } else {
      return {
        t: this.t,
        moment: this.momentInstance,
      };
    }
  }

  /**
   * Register translation
   *
   * @param {*} language
   * @param {*} translation
   * @param {*} customMomentLocale
   */
  registerTranslation(language, translation, customMomentLocale) {
    if (!translation) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customMomentLocale) called without translation`,
      );
      return;
    }

    if (!this.translations[language]) {
      this.translations[language] = { [defaultNS]: translation };
    } else {
      this.translations[language][defaultNS] = translation;
    }

    if (customMomentLocale) {
      this.momentLocales[language] = { ...customMomentLocale };
    } else if (!this.momentLocaleExists(language)) {
      this.logger(
        `Streami18n: registerTranslation(language, translation, customMomentLocale) - ` +
          `Locale config for ${language} does not exist in momentjs.` +
          `Please import the locale file using "import 'moment/locale/${language}';" in your app or ` +
          `register the locale config with Streami18n using registerTranslation(language, translation, customMomentLocale)`,
      );
    }

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  }

  addOrUpdateMomentLocaleConfig(language, config) {
    if (this.momentLocaleExists(language)) {
      Moment.updateLocale(language, config);
    } else {
      Moment.defineLocale(language, config);
    }
  }

  /**
   * Changes the language.
   * @param {*} language
   */
  async setLanguage(language) {
    this.currentLanguage = language;

    if (!this.initialized) return;

    try {
      const t = await this.i18nInstance.changeLanguage(language);
      if (this.momentLocales[language]) {
        this.addOrUpdateMomentLocaleConfig(
          language,
          this.momentLocales[language],
        );
      }

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
