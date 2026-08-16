import type { StreamTFunction, TranslationKey } from './types';
import { asDynamicKey } from './utils';

/**
 * English strings emitted by `stream-chat` (the LLC) reach `t()` as runtime values, so the
 * extractor never sees them and they cannot be renamed from this repo. This table maps the ones we
 * recognise onto the SDK's own keys.
 *
 * Anything not listed falls through unchanged — the same behaviour as before this map existed: the
 * raw English string is displayed. That matters more here than it does on web, because
 * `components/Notifications/notificationTranslations.ts` calls `t(notification.message)` with
 * free-form text that can originate anywhere in the LLC. This class can therefore grow silently on
 * an LLC upgrade, and the passthrough is what keeps that from rendering a blank.
 *
 * Server-supplied strings keyed by a stable identifier rather than by their English text are
 * deliberately *not* here: their components declare those keys in local lookup tables, which keeps
 * them visible to the extractor. Renaming these at the source needs a `stream-chat` change; until
 * then this table is the seam.
 *
 * The string on the left is what renders in English, so `yarn build-translations` requires it to
 * match the key's catalog copy; deliberate rephrasings are allowlisted as
 * `REPHRASED_EXTERNAL_STRINGS` in `scripts/generate-i18n-keys.mts`.
 */
export const EXTERNAL_STRING_KEYS: Record<string, TranslationKey> = {
  // Populated once the call sites carry dotted keys — the values have to exist in the generated
  // catalog for `TranslationKey` to accept them. The three strings this SDK currently receives
  // from the LLC ('Option', 'Option already exists', 'Type a number from 2 to 10') all come from
  // the poll composer and land here with the poll call sites.
};

/**
 * Translate a string that originated outside the SDK. Known strings resolve through their stable
 * key; unknown ones are returned as-is.
 */
export const translateExternalString = (
  t: StreamTFunction,
  raw: string | undefined,
  options?: Record<string, unknown>,
): string => {
  if (!raw) return '';
  const key = EXTERNAL_STRING_KEYS[raw];
  // `raw` doubles as the default so a mapped-but-untranslated key still renders English.
  return key ? t(asDynamicKey(key), raw, options) : t(asDynamicKey(raw), raw, options);
};
