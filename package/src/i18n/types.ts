import type {
  LooseTranslationDictionaryOf,
  RelativeTimeCatalog,
  StreamTFunctionFor,
  TranslationDictionaryOf,
  TranslationKeyOf,
} from '@stream-io/i18n';
import type { LanguageNameCatalog } from 'stream-chat';

import type { BundledTranslationKey, TranslationCatalog as GeneratedCatalog } from './keys';

/**
 * The SDK's i18n types, instantiated from the generic helpers in `@stream-io/i18n`.
 *
 * The derivations live in `@stream-io/i18n` so both UI SDKs share one implementation, while the
 * catalog is generated from this SDK's own `t()` call sites. The helpers are generic over the
 * catalog rather than driven by module augmentation so that two catalogs can coexist in one
 * TypeScript program.
 *
 * `language.*` (from `stream-chat`, derived from the `TranslationLanguage` union) and
 * `relativeTime.*` (from `@stream-io/i18n`, used by `timestampFormatter(relativeCompact: true)`)
 * are intersected in, which keeps both compile-checked and overridable.
 */
export type TranslationCatalog = GeneratedCatalog & LanguageNameCatalog & RelativeTimeCatalog;

export type TranslationKey = TranslationKeyOf<TranslationCatalog>;
export type TranslationDictionary = TranslationDictionaryOf<TranslationCatalog>;
export type LooseTranslationDictionary = LooseTranslationDictionaryOf<TranslationCatalog>;

/**
 * The SDK's translation function. `BundledTranslationKey` covers the generated screen-reader labels
 * and lookup-table entries that reach `t()` as runtime values, so they are callable without an
 * inline default.
 */
export type StreamTFunction = StreamTFunctionFor<TranslationCatalog, BundledTranslationKey>;

export type {
  CalendarFormats,
  CustomFormatters,
  DateTimeParserModule,
  DayjsLocaleConfig,
  DurationFormatterOptions,
  DynamicTranslationKey,
  FormatterFactory,
  PredefinedFormatters,
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from '@stream-io/i18n';
