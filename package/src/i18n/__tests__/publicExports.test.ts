import * as sdk from '../../index';

import type {
  CalendarFormats,
  CustomFormatters,
  DayjsLocaleConfig,
  DurationFormatterOptions,
  DynamicTranslationKey,
  LooseTranslationDictionary,
  PredefinedFormatters,
  StreamI18nOptions,
  StreamTFunction,
  TDateTimeParser,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
  TranslationCatalog,
  TranslationDictionary,
  TranslationKey,
} from '../../index';

/**
 * The i18n public surface, pinned.
 *
 * Moving the runtime into `stream-chat/i18n` silently dropped `CalendarFormats` and `DayjsLocaleConfig`
 * from this package's exports: they had been re-exported from the deleted `utils/i18n/types.ts`, and
 * nothing here imports them, so neither the build nor the type gate noticed. Both are documented in
 * `ai-docs/i18n-v10-migration.md`'s type table, so an integrator would have hit it first.
 *
 * The type-only half is the important half — a missing type is invisible to a runtime check. It is an
 * assertion by construction: the imports above fail to compile if any of them stops being exported.
 */
describe('i18n public exports', () => {
  it('exports the runtime values the migration guide documents', () => {
    const expected = [
      'asDynamicKey',
      'defaultDateTimeParser',
      'defaultTranslatorFunction',
      'getCalendarDateStringForA11y',
      'getDateString',
      'getDateStringForA11y',
      'isDate',
      'isDayOrMoment',
      'isNumberOrString',
      'predefinedFormatters',
      'runtimeDefaults',
      'StreamI18n',
      // `@deprecated` alias kept for one release cycle; removing it is a breaking change.
      'Streami18n',
    ];

    expect(expected.filter((name) => !(name in sdk))).toEqual([]);
    // The check is only worth having if it can fail.
    expect(['nothingExportsThis'].filter((name) => !(name in sdk))).toEqual(['nothingExportsThis']);
  });

  it('exports the types the migration guide documents', () => {
    // Consumed only to keep the type-only imports live under `noUnusedLocals`; the compile is the test.
    type Pinned = [
      CalendarFormats,
      CustomFormatters,
      DayjsLocaleConfig,
      DurationFormatterOptions,
      DynamicTranslationKey,
      LooseTranslationDictionary,
      PredefinedFormatters,
      StreamI18nOptions,
      StreamTFunction,
      TDateTimeParser,
      TDateTimeParserInput,
      TDateTimeParserOutput,
      TimestampFormatterOptions,
      TranslationCatalog,
      TranslationDictionary,
      TranslationKey,
    ];

    const pinned: Pinned | undefined = undefined;
    expect(pinned).toBeUndefined();
  });
});
