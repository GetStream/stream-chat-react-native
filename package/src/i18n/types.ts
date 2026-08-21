import type {
  LanguageNameCatalog,
  LooseTranslationDictionaryOf,
  RelativeTimeCatalog,
  StreamTFunctionFor,
  TranslationDictionaryOf,
  TranslationKeyOf,
} from 'stream-chat/i18n';

import type { BundledTranslationKey, TranslationCatalog as GeneratedCatalog } from './keys';

/**
 * The SDK's i18n types, instantiated from the generic helpers in `stream-chat/i18n`.
 *
 * The derivations live in core so both UI SDKs share one implementation; the *catalog* stays here,
 * because it is generated from this SDK's own `t()` call sites. That split is why core's helpers are
 * generic over the catalog rather than driven by module augmentation — two catalogs have to be able to
 * coexist in one TypeScript program.
 *
 * Two slices come from core, because core owns the code that renders them: `language.*` (derived from
 * the same `TranslationLanguage` union the API uses) and `relativeTime.*` (used by
 * `timestampFormatter(relativeCompact: true)`). Intersecting them in keeps both compile-checked and
 * overridable.
 */
export type TranslationCatalog = GeneratedCatalog & LanguageNameCatalog & RelativeTimeCatalog;

export type TranslationKey = TranslationKeyOf<TranslationCatalog>;
export type TranslationDictionary = TranslationDictionaryOf<TranslationCatalog>;
export type LooseTranslationDictionary = LooseTranslationDictionaryOf<TranslationCatalog>;

/**
 * The SDK's translation function.
 *
 * `BundledTranslationKey` is generated: the screen-reader labels and lookup-table entries that reach
 * `t()` as runtime values, so there is nowhere to write an inline default. They are callable without one.
 */
export type StreamTFunction = StreamTFunctionFor<TranslationCatalog, BundledTranslationKey>;

export type {
  // Both are documented in `ai-docs/i18n-v10-migration.md`'s type table and were exported before the
  // runtime moved; re-exporting them here keeps the public surface unchanged.
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
} from 'stream-chat/i18n';
