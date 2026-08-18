import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import duration from 'dayjs/plugin/duration';
import localeData from 'dayjs/plugin/localeData';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import i18n, { type i18n as I18nInstance, FallbackLng } from 'i18next';

import type momentTimezone from 'moment-timezone';

import { calendarFormats } from './calendarFormats';
import { predefinedFormatters } from './predefinedFormatters';
import { CustomFormatters, PredefinedFormatters } from './types';

import type { TDateTimeParser } from '../../contexts/translationContext/types';
import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type {
  LooseTranslationDictionary,
  StreamTFunction,
  TranslationDictionary,
} from '../../i18n/types';

// Only the English locale ships. Integrators registering another language import their own
// `dayjs/locale/xx` and pass `dayjsLocaleConfigForLanguage` (or `registerTranslation`'s third
// argument).
import 'dayjs/locale/en';

const defaultNS = 'translation';
const defaultLng = 'en';

Dayjs.extend(updateLocale);
Dayjs.extend(utc);

Dayjs.updateLocale('en', {
  calendar: calendarFormats.en,
  format: {
    L: 'DD/MM/YYYY',
    LL: 'D MMMM YYYY',
    LLL: 'D MMMM YYYY HH:mm',
    LLLL: 'dddd, D MMMM YYYY HH:mm',
    LT: 'hh:mmA',
    LTS: 'HH:mm:ss',
  },
});

/**
 * A dayjs locale config, as accepted by `dayjsLocaleConfigForLanguage` and by
 * `registerTranslation`'s third argument.
 *
 * `calendar` is not part of dayjs's own `ILocale` — it comes from the calendar plugin — so it has
 * to be added here. Typing this as a bare `Partial<ILocale>` makes passing a calendar config a
 * TS2345 "no properties in common" error, which is exactly the wording an integrator hits first.
 * Supplying `calendar` is how relative wording ("heute um", "ieri alle") gets localized.
 */
export type DayjsLocaleConfig = Partial<ILocale> & { calendar?: CalendarFormats };

export type CalendarFormats = {
  lastDay: string;
  lastWeek: string;
  nextDay: string;
  nextWeek: string;
  sameDay: string;
  sameElse: string;
};

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

type DateTimeParserModule = typeof Dayjs | typeof momentTimezone;

// Type guards to check DayJs
const isDayJs = (dateTimeParser: DateTimeParserModule): dateTimeParser is typeof Dayjs =>
  (dateTimeParser as typeof Dayjs).extend !== undefined;

type TimezoneParser = {
  tz: momentTimezone.MomentTimezone | Dayjs.Dayjs;
};

const supportsTz = (dateTimeParser: unknown): dateTimeParser is TimezoneParser =>
  (dateTimeParser as TimezoneParser).tz !== undefined;

type Streami18nOptions = {
  DateTimeParser?: DateTimeParserModule;
  dayjsLocaleConfigForLanguage?: DayjsLocaleConfig;
  debug?: boolean;
  disableDateTimeTranslations?: boolean;
  formatters?: Partial<PredefinedFormatters> & CustomFormatters;
  language?: string;
  logger?: (msg?: string) => void;
  timezone?: string;
  translationsForLanguage?: TranslationDictionary;
};

type I18NextConfig = {
  debug: boolean;
  fallbackLng: false | FallbackLng;
  interpolation: { escapeValue: boolean; formatSeparator: string };
  keySeparator: false | string;
  lng: string;
  nsSeparator: false | string;
  parseMissingKeyHandler: (key: string, defaultValue?: string) => string;
};

/**
 * Wrapper around [i18next](https://www.i18next.com/) for Stream's translations. Pass an instance to
 * `<Chat>` to control language and copy.
 *
 * Only English ships with the SDK, and only as much of it as has to: prose renders from the inline
 * `defaultValue` at each call site, so the bundled data is just the formatter expressions and the
 * handful of keys resolved by name at runtime. Every other language comes from the integrator.
 *
 * ## Overriding some of the English copy
 *
 * Anything not mentioned is untouched.
 *
 * ```ts
 * import { Streami18n, type TranslationDictionary } from 'stream-chat-react-native';
 *
 * const i18n = new Streami18n({
 *   translationsForLanguage: {
 *     'autoCompleteInput.placeholder': 'Write something…',
 *   } satisfies TranslationDictionary,
 * });
 *
 * <Chat client={client} i18nInstance={i18n}>…</Chat>
 * ```
 *
 * Keys are checked against the generated catalog, so a typo or a leftover v9 key is a compile
 * error rather than an override that silently never applies. Run `yarn i18n:export` to dump every
 * key with its English copy.
 *
 * ## Registering a new language
 *
 * ```ts
 * import { Streami18n, type TranslationDictionary } from 'stream-chat-react-native';
 * import 'dayjs/locale/de';
 *
 * const de: TranslationDictionary = {
 *   'common.cancel.label': 'Abbrechen',
 *   'channelDetails.memberSection.title_one': '{{count}} Mitglied',
 *   'channelDetails.memberSection.title_other': '{{count}} Mitglieder',
 * };
 *
 * const i18n = new Streami18n({ language: 'de' });
 * i18n.registerTranslation('de', de, {
 *   calendar: { sameDay: '[heute um] LT', lastDay: '[gestern um] LT' /* … *\/ },
 * });
 * ```
 *
 * A partial dictionary is safe: keys you do not supply render their English copy, never a raw
 * dotted path. Every language is layered over the bundled defaults — however it was selected, and
 * even with no dictionary at all — so overriding one string cannot knock out timestamps.
 *
 * Plurals are stored as `<key>_one` / `<key>_other`; supply whichever categories your language
 * needs and `Intl.PluralRules` selects between them, so Arabic, Hebrew and Russian can add
 * `_zero` / `_few` / `_many` and stay type-checked.
 *
 * ## Dates and times
 *
 * Only the `en` dayjs locale is bundled. Import your own locale and pass
 * `dayjsLocaleConfigForLanguage` (or `registerTranslation`'s third argument), or supply a
 * preconfigured `DateTimeParser`:
 *
 * ```ts
 * import Dayjs from 'dayjs';
 * import 'dayjs/locale/nl';
 *
 * const i18n = new Streami18n({ language: 'nl', DateTimeParser: Dayjs });
 * ```
 *
 * Two `timestamp.*` keys carry their own `calendarFormats` with English day words baked in —
 * `timestamp.ChannelPreviewStatus` and `timestamp.ThreadListItem`. A per-key `calendarFormats`
 * replaces the locale's calendar wholesale, so `dayjsLocaleConfigForLanguage` never reaches them;
 * override the two keys directly. See `ai-docs/i18n-v10-migration.md`.
 *
 * Set `disableDateTimeTranslations` to keep dates in English regardless of language.
 */
/**
 * Wraps an integrator's `parseMissingKeyHandler` so it only sees genuinely missing translations.
 *
 * i18next counts every prose key as missing — they render from the inline `defaultValue`, not from
 * a resource bundle — and lets the handler's return value replace the rendered string. An
 * unguarded handler therefore blanks out most of the UI. A resolved default arrives as the second
 * argument, which is how the two cases are told apart.
 */
const guardMissingKeyHandler =
  (handler: (key: string, defaultValue?: string) => string) =>
  (key: string, defaultValue?: string) => {
    if (typeof defaultValue === 'string') return defaultValue;
    return handler(key, defaultValue);
  };

const defaultStreami18nOptions = {
  DateTimeParser: Dayjs,
  dayjsLocaleConfigForLanguage: null,
  debug: false,
  disableDateTimeTranslations: false,
  language: 'en',
  logger: (msg?: string) => console.warn(msg),
};

/**
 * The `t` used before `Streami18n` has finished initializing, and the default value of the
 * translation context.
 *
 * It has to honour the inline `defaultValue`: every prose call site now passes its English copy as
 * the second argument, so echoing the key back would flash raw dotted paths on the first frame and
 * would render them permanently anywhere the context default is in play.
 */
export const defaultTranslatorFunction = ((
  key: string,
  defaultValueOrOptions?: string | Record<string, unknown>,
  maybeOptions?: Record<string, unknown>,
) => {
  if (typeof defaultValueOrOptions === 'string') return defaultValueOrOptions;

  // Plural call sites pass their copy as `defaultValue_one` / `defaultValue_other` inside the
  // options object, so a bare `defaultValue` check would still leak the raw key for them. English
  // only distinguishes one vs. other; a registered language's own categories are irrelevant here,
  // since this function is only ever in play before i18next has initialized.
  const options = (
    typeof defaultValueOrOptions === 'object' ? defaultValueOrOptions : maybeOptions
  ) as Record<string, unknown> | undefined;
  if (options) {
    const count = options.count;
    const form = count === 1 ? options.defaultValue_one : options.defaultValue_other;
    const resolved = form ?? options.defaultValue;
    if (typeof resolved === 'string') {
      // Interpolate the placeholders the copy declares, so `{{count}} members` does not render
      // with a literal `{{count}}`.
      return resolved.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name) =>
        options[name] === undefined ? whole : String(options[name]),
      );
    }
  }

  return key;
}) as unknown as StreamTFunction;

export class Streami18n {
  i18nInstance: I18nInstance = i18n.createInstance();
  Dayjs = null;
  initialized = false;
  /* this promise is used to prevent simultaneous calls to init (happens in Overlay and Chat) */
  private waitForInitializing: Promise<void> | undefined;
  /* This is the callback to be fired when the language is changed */
  private onLanguageChangeListeners: ((t: StreamTFunction) => void)[] = [];
  /* This is the callback to be fired when the tFunc is overridden
   * This is useful when a different i18n library needs to be used
   * The SDK uses this in useStreami18n hook to set the tFunc in the context
   */
  private onTFunctionOverrideListeners: ((t: StreamTFunction) => void)[] = [];
  /* We need to queue the overridden tFunction
   * if the tFunction is overridden before the SDK has initialized the translations
   */
  private queuedTFunctionOverride: StreamTFunction | undefined;

  t: StreamTFunction = defaultTranslatorFunction;
  tDateTimeParser: TDateTimeParser;

  /**
   * The resource dictionaries handed to i18next, keyed by language.
   *
   * Not the full English catalog: prose keys are never bundled — they render from the inline
   * `defaultValue` at their call site — so `en` holds `runtimeDefaults` plus whatever has been
   * registered. To enumerate every key with its copy use {@link TranslationCatalog} or
   * `yarn i18n:export`.
   */
  translations: {
    [key: string]: {
      [key: string]: LooseTranslationDictionary;
    };
  } = {};

  /**
   * Languages an integrator actually supplied a dictionary for.
   *
   * Deliberately narrower than `Object.keys(this.translations)`, which also contains every language
   * `ensureLanguage` created to carry `runtimeDefaults`. Without the distinction the
   * unregistered-language warning could never fire.
   */
  registeredLanguages = new Set<string>([defaultLng]);

  /**
   * A dictionary layered over `runtimeDefaults`. Every write into `this.translations` goes through
   * here: those keys have no inline `defaultValue` at their call site and `fallbackLng` is false,
   * so a language missing them renders raw dotted keys and unformatted ISO timestamps.
   */
  private mergeWithRuntimeDefaults = (
    language: string,
    translation?: LooseTranslationDictionary,
  ): LooseTranslationDictionary => ({
    ...runtimeDefaults,
    ...this.translations[language]?.[defaultNS],
    ...translation,
  });

  /**
   * Guarantees `language` has a dictionary, so a language nobody registered still formats dates and
   * renders the SDK's copy in English. Writes into i18next's store too when already initialized —
   * the only route for a language added after `init()`.
   */
  private ensureLanguage = (language: string) => {
    const translation = this.mergeWithRuntimeDefaults(language);
    this.translations[language] = { [defaultNS]: translation };

    if (this.initialized) {
      this.i18nInstance.addResources(language, defaultNS, translation);
    }
  };

  /**
   * dayjs.defineLanguage('nl') also changes the global locale. We don't want to do that
   * when a user calls the registerTranslation() function. So instead we will store the
   * locale configs given to the registerTranslation() function in `dayjsLocales` object,
   * and register the required locale with moment when setLanguage is called.
   */
  dayjsLocales: { [key: string]: DayjsLocaleConfig } = {};

  /**
   * Initialize properties used in constructor
   */
  logger: (msg?: string) => void;
  currentLanguage: string;
  DateTimeParser: DateTimeParserModule;
  formatters: PredefinedFormatters & CustomFormatters = predefinedFormatters;
  isCustomDateTimeParser: boolean;
  i18nextConfig: I18NextConfig;
  /**
   * A valid TZ identifier string (https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
   */
  timezone?: string;

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
  constructor(options: Streami18nOptions = {}, i18nextConfig: Partial<I18NextConfig> = {}) {
    const finalOptions = {
      ...defaultStreami18nOptions,
      ...options,
    };

    // Prepare the i18next configuration.
    this.logger = finalOptions.logger;

    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;
    this.timezone = finalOptions.timezone;
    this.formatters = { ...predefinedFormatters, ...options?.formatters };

    try {
      /**
       * This is a shallow check to see if the given parser is an instance of Dayjs.
       * For some reason Dayjs.isDayjs(this.DateTimeParser()) doesn't work.
       */
      if (this.DateTimeParser && isDayJs(this.DateTimeParser)) {
        this.DateTimeParser.extend(duration);
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

    // `en` always exists so the bundled formatter keys resolve, and so does the active language —
    // including one nobody registered, which then renders the SDK's English copy from the inline
    // defaults rather than dotted key paths.
    this.ensureLanguage(defaultLng);
    this.ensureLanguage(this.currentLanguage);

    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: this.mergeWithRuntimeDefaults(this.currentLanguage, translationsForLanguage),
      };
      this.registeredLanguages.add(this.currentLanguage);
    }

    this.i18nextConfig = {
      debug: finalOptions.debug,
      fallbackLng: false,
      interpolation: { escapeValue: false, formatSeparator: '|' },
      keySeparator: false,
      lng: this.currentLanguage,
      nsSeparator: false,

      parseMissingKeyHandler: (key: string, defaultValue?: string) => {
        // i18next counts every prose key as "missing" — they render from the inline `defaultValue`
        // at the call site, not from a resource bundle — and lets this handler's return value
        // replace the rendered string. Returning the key unconditionally would therefore render a
        // raw dotted path for most of the UI. A resolved default arrives as the second argument,
        // which is how a genuinely missing key is told apart from one that simply is not bundled.
        if (typeof defaultValue === 'string') return defaultValue;

        this.logger(`Streami18n: Missing translation for key: ${key}`);

        return key;
      },
      ...i18nextConfig,
    };

    // An integrator handler replaces ours wholesale, so it has to be guarded too — otherwise
    // supplying one silently blanks every prose key.
    if (i18nextConfig.parseMissingKeyHandler) {
      this.i18nextConfig.parseMissingKeyHandler = guardMissingKeyHandler(
        i18nextConfig.parseMissingKeyHandler,
      );
    }

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
          'register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)',
      );
    }

    this.tDateTimeParser = (timestamp) => {
      const language =
        finalOptions.disableDateTimeTranslations || !this.localeExists(this.currentLanguage)
          ? defaultLng
          : this.currentLanguage;

      // If the DateTimeParser is not a Dayjs instance, we assume it is a Moment instance.
      if (!isDayJs(this.DateTimeParser)) {
        return supportsTz(this.DateTimeParser) && this.timezone
          ? this.DateTimeParser(timestamp).tz(this.timezone).locale(language)
          : this.DateTimeParser(timestamp).locale(language);
      }

      return this.DateTimeParser(timestamp).locale(language);
    };
  }

  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */
  private async init() {
    this.validateCurrentLanguage();

    try {
      // i18next hands back its own `TFunction`; the SDK's narrower signature is what call
      // sites are checked against, so the cast happens once, here.
      this.t = (await this.i18nInstance.init({
        ...this.i18nextConfig,
        lng: this.currentLanguage,
        resources: this.translations,
      })) as unknown as StreamTFunction;
      if (this.queuedTFunctionOverride) {
        // special case where we have a override for tFunc before initialization
        this.t = this.queuedTFunctionOverride;
        this.queuedTFunctionOverride = undefined;
        this.onTFunctionOverrideListeners.forEach((listener) => listener(this.t));
      }
      this.initialized = true;
      if (this.formatters) {
        Object.entries(this.formatters).forEach(([name, formatterFactory]) => {
          if (!formatterFactory) {
            return;
          }
          this.i18nInstance.services.formatter?.add(name, formatterFactory(this));
        });
      }
    } catch (error) {
      this.logger(`Something went wrong with init: ${JSON.stringify(error)}`);
    }
    this.waitForInitializing = undefined;
  }

  localeExists = (language: string) => {
    if (this.isCustomDateTimeParser) {
      return true;
    }

    return Object.keys(Dayjs.Ls).indexOf(language) > -1;
  };

  /**
   * Warns when the active language has no registered dictionary.
   *
   * Not an error, and not a reason to fall back to `en`: the language renders the SDK's English
   * copy from the inline defaults while keeping its own date formats. Silently resetting the
   * language instead — as this used to — discarded the integrator's choice and made the cause very
   * hard to see.
   */
  validateCurrentLanguage = () => {
    if (this.registeredLanguages.has(this.currentLanguage)) return;

    this.logger(
      `Streami18n: no translation dictionary is registered for '${this.currentLanguage}', so the ` +
        `SDK's copy renders in English. Call ` +
        `streami18n.registerTranslation('${this.currentLanguage}', {...}) to translate it. ` +
        `Registered: ${[...this.registeredLanguages].join(', ')}`,
    );
  };

  /** Returns an instance of i18next used within this class instance */
  geti18Instance = (): I18nInstance => this.i18nInstance;

  /** Returns list of available languages. */
  getAvailableLanguages = () => Object.keys(this.translations);

  /** Returns all the translation dictionary for all inbuilt-languages */
  getTranslations = () => this.translations;

  /**
   * Returns current version translator function.
   */
  async getTranslators() {
    if (!this.initialized) {
      if (this.waitForInitializing) {
        await this.waitForInitializing;
      } else {
        if (this.dayjsLocales[this.currentLanguage]) {
          this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
        }
        const initPromise = this.init();
        this.waitForInitializing = initPromise;
        await initPromise;
      }
    }
    return {
      t: this.t,
      tDateTimeParser: this.tDateTimeParser,
    };
  }

  /**
   * Register translation
   */
  registerTranslation(
    language: string,
    translation: TranslationDictionary,
    customDayjsLocale?: DayjsLocaleConfig,
  ) {
    if (!translation) {
      this.logger(
        'Streami18n: registerTranslation(language, translation, customDayjsLocale) called without translation',
      );
      return;
    }

    // Merged, not replaced, so repeated calls for one language accumulate and the bundled
    // formatter keys survive a partial dictionary.
    const merged = this.mergeWithRuntimeDefaults(language, translation);
    this.translations[language] = { [defaultNS]: merged };
    this.registeredLanguages.add(language);

    if (customDayjsLocale) {
      this.dayjsLocales[language] = { ...customDayjsLocale };
    } else if (!this.localeExists(language)) {
      this.logger(
        'Streami18n: registerTranslation(language, translation, customDayjsLocale) - ' +
          `Locale config for ${language} does not exist in Dayjs.` +
          `Please import the locale file using "import 'dayjs/locale/${language}';" in your app or ` +
          'register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)',
      );
    }

    if (this.initialized) {
      // `merged`, not `translation`: for a language registered after init this is the only write
      // into i18next's store, so passing the partial would leave `runtimeDefaults` absent there.
      this.i18nInstance.addResources(language, defaultNS, merged);
    }
  }

  addOrUpdateLocale(key: string, config: DayjsLocaleConfig) {
    if (this.localeExists(key)) {
      Dayjs.updateLocale(key, { ...config });
    } else {
      // Merging the custom locale config with en config, so missing keys can default to english.
      Dayjs.locale({ name: key, ...en_locale, ...config }, undefined, true);
    }
  }

  /**
   * Changes the language.
   * Note: if you are using overrideTFunction, you will need to call the override again after changing the language.
   */
  async setLanguage(language: string) {
    this.currentLanguage = language;
    this.ensureLanguage(language);

    if (!this.initialized) {
      return;
    }

    this.validateCurrentLanguage();

    try {
      const t = (await this.i18nInstance.changeLanguage(language)) as unknown as StreamTFunction;
      if (this.dayjsLocales[language]) {
        this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
      }
      this.t = t;
      this.onLanguageChangeListeners.forEach((listener) => listener(t));

      return t;
    } catch (error) {
      this.logger(`Failed to set language: ${JSON.stringify(error)}`);
      return this.t;
    }
  }

  addOnLanguageChangeListener(callback: (t: StreamTFunction) => void) {
    this.onLanguageChangeListeners.push(callback);
    return {
      unsubscribe: () => {
        this.onLanguageChangeListeners = this.onLanguageChangeListeners.filter(
          (listener) => listener !== callback,
        );
      },
    };
  }

  addOnTFunctionOverrideListener(callback: (t: StreamTFunction) => void) {
    this.onTFunctionOverrideListeners.push(callback);
    return {
      unsubscribe: () => {
        this.onTFunctionOverrideListeners = this.onTFunctionOverrideListeners.filter(
          (listener) => listener !== callback,
        );
      },
    };
  }

  overrideTFunction(tFunction: StreamTFunction) {
    if (!this.initialized) {
      this.queuedTFunctionOverride = tFunction;
    } else {
      this.t = tFunction;
      this.onTFunctionOverrideListeners.forEach((listener) => listener(tFunction));
    }
  }
}
