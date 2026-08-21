import { languageNameDefaults, Streami18n as CoreStreami18n } from 'stream-chat/i18n';
import type { Streami18nOptions as CoreStreami18nOptions } from 'stream-chat/i18n';

import type { BundledTranslationKey } from '../../i18n/keys';
import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type { TranslationCatalog } from '../../i18n/types';

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
  }
}
