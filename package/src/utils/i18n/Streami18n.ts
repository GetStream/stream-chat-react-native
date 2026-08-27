import {
  addOrUpdateDayjsLocale,
  DEFAULT_LANGUAGE,
  isDayjsLike,
  languageNameDefaults,
  Streami18n as CoreStreami18n,
} from 'stream-chat/i18n';
import type {
  CalendarFormats,
  Streami18nOptions as CoreStreami18nOptions,
  DateTimeParserModule,
} from 'stream-chat/i18n';

import type { BundledTranslationKey } from '../../i18n/keys';
import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type { TranslationCatalog } from '../../i18n/types';

/**
 * The English calendar wording the SDK ships, for the dayjs calendar plugin.
 *
 * Bundled data, the same way `runtimeDefaults` is, and layered the same way: underneath anything an
 * integrator supplies. `timestamp.*` keys formatted with `timestampFormatter(calendar: true)` and no
 * `calendarFormats` argument of their own read this off the active dayjs locale, and nothing else
 * supplies it — no locale file defines `calendar`, and dayjs already has `en` registered, so core's
 * locale fallback never gets a chance to fill it in. Without it the plugin's own defaults apply and a
 * date separator reads "Today at 3:04 PM" where every previous version read "Today".
 *
 * Exported so a new language can be built from it (`{ ...englishCalendarFormats, sameDay: '[heute]' }`)
 * rather than transcribed.
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
 * The calendar slots already registered on dayjs's `en` locale.
 *
 * Read back rather than assumed empty, because {@link englishCalendarFormats} is a default and must not
 * overwrite a choice already made. Two things get there before this runs: core applies
 * `dayjsLocaleConfigForLanguage` inside its own constructor, and an app is free to call
 * `Dayjs.updateLocale('en', { calendar })` itself — which the v10 migration guide suggests for anyone
 * bringing their own `DateTimeParser`.
 *
 * Filtered to the six known slots with string values: whatever is in the registry came from outside and
 * is typed `unknown`, and a stray key would be spread straight into a config dayjs then formats with.
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

/**
 * Options for {@link Streami18n}.
 *
 * `runtimeDefaults` is accepted and *merged* over the SDK's own, so supplying it adds to rather than
 * replaces what the SDK ships.
 */
export type Streami18nOptions = CoreStreami18nOptions<TranslationCatalog>;

/**
 * Wrapper around [i18next](https://www.i18next.com/) for this SDK's translations. Pass an instance to
 * `<Chat i18nInstance={…}>` to control language and copy.
 *
 * The implementation lives in `stream-chat/i18n`, shared with the React SDK, so both behave identically
 * and a fix reaches both at once. What is added here is this SDK's own bundled translation data — core
 * cannot import it, because the key catalog is generated from *this* package's `t()` call sites.
 *
 * ## Overriding some of the English copy
 *
 * ```ts
 * const i18n = new Streami18n({
 *   translationsForLanguage: { 'autoCompleteInput.placeholder': 'Write something…' },
 * });
 * ```
 *
 * ## Registering a language
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
 * A partial dictionary is safe: keys you do not supply render their English copy, never a raw dotted
 * path. Note no dayjs locale file defines `calendar` — that field belongs to the calendar plugin — so a
 * new language needs both the locale import and a `calendar` config, or relative dates render English
 * scaffolding around translated day names.
 *
 * Reactivity goes through `i18n.state`, a `StateStore`. `setLanguage()` returns nothing — the new `t` is
 * published to that store, which `<Chat>` subscribes to.
 */
export class Streami18n extends CoreStreami18n<TranslationCatalog, BundledTranslationKey> {
  constructor(options: Streami18nOptions = {}) {
    super({
      ...options,
      // Core owns the `language.*` names, since it owns the `TranslationLanguage` union they describe.
      // Merged under this SDK's data, and the caller's over both, so an individual name stays overridable.
      runtimeDefaults: {
        ...languageNameDefaults,
        ...runtimeDefaults,
        ...options.runtimeDefaults,
      },
    });

    // Scoped to `en`, and only to the slots nothing has claimed. A translated app is untouched: dayjs
    // reads `calendar` off the active locale and never falls back to another one, so this is reachable
    // only when English is what was asked for — `language: 'en'`, `disableDateTimeTranslations`, or an
    // active language whose dayjs locale was never imported, which core warns about separately.
    //
    // On the parser module rather than our own dayjs copy, an integrator-supplied `DateTimeParser` has
    // its own locale registry, and writing to ours would leave the one that formats the dates without it.
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
