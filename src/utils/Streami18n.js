import i18n from 'i18next';

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

const defaultNS = 'translation';
const defaultLng = 'en';
/**
 * Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.
 * Instance of this class should be provided to Chat component to handle translations.
 *
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
 * const i18n = new Streami18n('nl);
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * If you would like to override certain keys in in-built translation.
 * UI will be automatically updated in this case.
 *
 * ```
 * const i18n = new Streami18n('nl);
 *
 * i18n.registerTranslation('nl', {
 *  'Nothing yet...': 'Nog Niet ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 * });
 *
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * You can use the same function to add whole new language.
 *
 * ```
 * const i18n = new Streami18n('it');
 *
 * i18n.registerTranslation('it', {
 *  'Nothing yet...': 'Non ancora ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} a {{ secondUser }} stanno scrivendo...',
 * });
 *
 * // Make sure to call setLanguage to reflect new language in UI.
 * i18n.setLanguage('it');
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 */
export class Streami18n {
  i18nInstance = i18n.createInstance();
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
   * @param {*} currentLanguage e.g., 'en', 'nl' etc
   * @param {*} i18nextConfig Config object to override default config - https://www.i18next.com/overview/configuration-options
   * @param {*} logger - Logger function to get error logs if something fails. Should be used in dev mode.
   */
  constructor(
    currentLanguage = defaultLng,
    i18nextConfig = {},
    logger = () => {},
  ) {
    this.currentLanguage = currentLanguage;
    this.logger = logger;
    this.i18nextConfig = {
      nsSeparator: false,
      keySeparator: false,
      fallbackLng: false,
      debug: true,
      lng: this.currentLanguage,
      parseMissingKeyHandler: (key) => {
        this.logger(`Missing translation for key: ${key}`);

        return key;
      },
      ...i18nextConfig,
    };

    this.validateCurrentLanguage(currentLanguage);
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

      return this.t;
    } catch (e) {
      this.logger(`Something went wrong with init:`, e);
    }
  }

  validateCurrentLanguage = () => {
    const availableLanguages = Object.keys(this.translations);
    if (availableLanguages.indexOf(this.currentLanguage) === -1) {
      console.error(
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
  async getTranslator() {
    if (!this.initialized) {
      return await this.init();
    } else {
      return this.t;
    }
  }

  /**
   *
   * @param {*} key e.g., 'en' | 'nl
   * @param {*} translation
   */
  registerTranslation(key, translation) {
    if (!this.translations[key]) {
      this.translations[key] = { [defaultNS]: translation };
    } else {
      this.translations[key][defaultNS] = translation;
    }

    if (this.initialized) {
      this.i18nInstance.addResources(key, defaultNS, translation);
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
