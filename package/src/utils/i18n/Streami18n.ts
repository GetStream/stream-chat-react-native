import {
  addOrUpdateDayjsLocale,
  DEFAULT_LANGUAGE,
  isDayjsLike,
  Streami18n as CoreStreami18n,
} from '@stream-io/i18n';
// `languageNameDefaults` (the names of the languages the API can auto-translate into) is Chat API
// metadata, so it comes from `stream-chat` rather than the generic i18n package.
import type {
  CalendarFormats,
  Streami18nOptions as CoreStreami18nOptions,
  DateTimeParserModule,
} from '@stream-io/i18n';
import { languageNameDefaults } from 'stream-chat';

import type { BundledTranslationKey } from '../../i18n/keys';
import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type { TranslationCatalog } from '../../i18n/types';

/**
 * The English calendar wording the SDK ships for the dayjs calendar plugin, layered under any
 * calendar an integrator supplies.
 *
 * `timestamp.*` keys formatted with `timestampFormatter(calendar: true)` and no `calendarFormats`
 * argument read it off the active dayjs locale. No locale file defines `calendar` and dayjs already
 * has `en` registered, so without it the plugin defaults apply ("Today at 3:04 PM", not "Today").
 *
 * Exported so a new language can extend it: `{ ...englishCalendarFormats, sameDay: '[heute]' }`.
 */
export const englishCalendarFormats: CalendarFormats = {
  lastDay: '[Yesterday]',
  lastWeek: 'dddd',
  nextDay: '[Tomorrow]',
  nextWeek: 'dddd [at] LT',
  sameDay: '[Today]',
  sameElse: 'L',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * The calendar slots already registered on dayjs's `en` locale, so that the
 * {@link englishCalendarFormats} defaults do not overwrite them. Core's constructor and the app
 * (`Dayjs.updateLocale('en', { calendar })`) can both register them first.
 *
 * Only known slots with string values are returned, because the registry is untyped external data.
 */
const registeredEnglishCalendar = (parser: DateTimeParserModule): Partial<CalendarFormats> => {
  const registry = 'Ls' in parser ? parser.Ls : undefined;
  if (!isRecord(registry)) return {};

  const locale = registry[DEFAULT_LANGUAGE];
  if (!isRecord(locale) || !isRecord(locale.calendar)) return {};

  const slots: [string, string][] = [];
  for (const [slot, format] of Object.entries(locale.calendar)) {
    if (slot in englishCalendarFormats && typeof format === 'string') slots.push([slot, format]);
  }
  return Object.fromEntries(slots);
};

/** Options for {@link Streami18n}. `runtimeDefaults` is merged over the SDK's own. */
export type Streami18nOptions = CoreStreami18nOptions<TranslationCatalog>;

/**
 * Wrapper around [i18next](https://www.i18next.com/) for this SDK's translations. Pass an instance
 * to `<Chat i18nInstance={…}>` to control language and copy.
 *
 * The implementation lives in `@stream-io/i18n`, shared with the React SDK. This class adds the
 * SDK's bundled translation data, which core cannot import because the key catalog is generated
 * from this package's `t()` call sites.
 *
 * Overriding some of the English copy:
 *
 * ```ts
 * const i18n = new Streami18n({
 *   translationsForLanguage: { 'autoCompleteInput.placeholder': 'Write something…' },
 * });
 * ```
 *
 * Registering a language:
 *
 * ```ts
 * import 'dayjs/locale/de';
 *
 * const i18n = new Streami18n({ language: 'de' });
 * i18n.registerTranslation('de', de, {
 *   calendar: { sameDay: '[heute um] LT', lastDay: '[gestern um] LT' },
 * });
 * ```
 *
 * Keys missing from a partial dictionary render their English copy, never a raw dotted path. No
 * dayjs locale file defines `calendar`, so a new language needs both the locale import and a
 * `calendar` config, or relative dates mix English with translated day names.
 *
 * `setLanguage()` resolves with no value: the new `t` is published to `i18n.state`, a `StateStore`
 * that `<Chat>` subscribes to.
 */
export class Streami18n extends CoreStreami18n<TranslationCatalog, BundledTranslationKey> {
  constructor(options: Streami18nOptions = {}) {
    super({
      ...options,
      // The `language.*` names come from `stream-chat`. Precedence: those, SDK data, the caller.
      runtimeDefaults: {
        ...languageNameDefaults,
        ...runtimeDefaults,
        ...options.runtimeDefaults,
      },
    });

    // Fills only unclaimed `en` slots. dayjs reads `calendar` off the active locale with no
    // fallback, so this matters only when English is active (`language: 'en'`,
    // `disableDateTimeTranslations`, or a language whose dayjs locale was never imported).
    //
    // Written to the parser module, not our own dayjs copy: a custom `DateTimeParser` has its own
    // locale registry, and that is the one that formats the dates.
    if (isDayjsLike(this.DateTimeParser)) {
      addOrUpdateDayjsLocale(
        DEFAULT_LANGUAGE,
        {
          calendar: {
            ...englishCalendarFormats,
            ...registeredEnglishCalendar(this.DateTimeParser),
          },
        },
        this.DateTimeParser,
      );
    }
  }
}
