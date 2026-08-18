import type { TOptions } from 'i18next';

import type { BundledTranslationKey, TranslationCatalog } from './keys';

type Whitespace = ' ' | '\n' | '\t';
type Trim<S extends string> = S extends `${Whitespace}${infer R}`
  ? Trim<R>
  : S extends `${infer R}${Whitespace}`
    ? Trim<R>
    : S;

/** `{{ value, formatter }}` and `{{ value | formatter(...) }}` — the name is the leading part. */
type VarName<S extends string> = Trim<
  S extends `${infer Name},${string}` ? Name : S extends `${infer Name}|${string}` ? Name : S
>;

/**
 * The interpolation variables a copy string requires.
 *
 * i18next ships `InterpolationMap`, but it does not trim the placeholder, so `{{ setting }}`
 * yields a property literally named `" setting "`. The SDK's copy uses spaced placeholders
 * throughout, so we parse them ourselves.
 */
type InterpolationVars<S extends string> = S extends `${string}{{${infer V}}}${infer Rest}`
  ? (VarName<V> extends '' ? never : VarName<V>) | InterpolationVars<Rest>
  : never;

type InterpolationArgs<S extends string> = [InterpolationVars<S>] extends [never]
  ? Record<never, never>
  : { [K in InterpolationVars<S>]: number | string };

type PluralSuffix = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
type CatalogKey = keyof TranslationCatalog & string;

/**
 * Keys whose catalog entries are plural forms (`<key>_one` / `<key>_other`). Call sites use the
 * bare key and pass `count`; the suffixed forms are never referenced directly.
 */
export type PluralTranslationKey = CatalogKey extends infer K
  ? K extends `${infer Base}_other`
    ? Base
    : never
  : never;

/**
 * Every key the SDK's `t` accepts: the singular entries plus the bare handle for each plural.
 *
 * This is the *call-site* key set — use it to type a `t` parameter. It is deliberately **not** the
 * right type for a dictionary: a plural lives in the catalog as `<key>_one` / `<key>_other` while
 * `t()` takes the bare `<key>`, so keying a dictionary on this rejects the very entries a
 * translator has to supply. Use {@link TranslationDictionary} for that.
 */
export type TranslationKey =
  | Exclude<CatalogKey, `${string}_${PluralSuffix}`>
  | PluralTranslationKey;

/**
 * A translation dictionary for `Streami18n.registerTranslation()` / `translationsForLanguage`.
 *
 * Restricted to the SDK's own keys, so a typo or a leftover v9 key is a compile error rather than
 * an override that silently never applies. Keyed on the catalog rather than on
 * {@link TranslationKey}, so the `_one` / `_other` plural entries are accepted.
 *
 * The SDK's own copy only needs `_one` / `_other`, but a plural key accepts every category
 * `Intl.PluralRules` can select, so Arabic, Hebrew or Russian can supply `_few`, `_many` and
 * `_zero` and still have its keys checked. A plural suffix on a key that is not plural is
 * rejected.
 *
 * Widen to {@link LooseTranslationDictionary} only when you need keys the SDK does not define.
 *
 * @example
 * const de: TranslationDictionary = {
 *   'common.cancel.label': 'Abbrechen',
 *   'channelDetail.members.title_one': '{{ count }} Mitglied',
 *   'channelDetail.members.title_other': '{{ count }} Mitglieder',
 * };
 *
 * @example
 * const ar: TranslationDictionary = {
 *   'channelDetail.members.title_zero': 'لا أعضاء',
 *   'channelDetail.members.title_one': 'عضو واحد',
 *   'channelDetail.members.title_few': '{{ count }} أعضاء',
 *   'channelDetail.members.title_many': '{{ count }} عضوًا',
 * };
 */
export type TranslationDictionary = Partial<Record<CatalogKey, string>> &
  Partial<Record<`${PluralTranslationKey}_${PluralSuffix}`, string>>;

/**
 * A translation dictionary that also admits keys the SDK does not define, so one `Streami18n`
 * instance can carry an application's own copy alongside the SDK's.
 *
 * `registerTranslation()` and `translationsForLanguage` take the strict
 * {@link TranslationDictionary}; annotate the variable you pass with this type to widen. Nothing
 * catches a mistyped or stale SDK key here — it compiles, and then never matches at runtime. Note
 * that {@link TranslationDictionary} already covers the extra plural categories, so a language
 * needing `_few` / `_many` / `_zero` does not have to give up key checking.
 */
export type LooseTranslationDictionary = Partial<Record<CatalogKey, string>> &
  Record<string, string>;

/** The English copy for a key, used to infer that key's interpolation variables. */
type CopyFor<K extends string> = K extends CatalogKey
  ? TranslationCatalog[K]
  : `${K}_other` extends CatalogKey
    ? TranslationCatalog[`${K}_other` & CatalogKey]
    : string;

/**
 * Keys resolved from the bundled `runtimeDefaults`, so call sites pass no inline default.
 *
 * Two kinds live here: formatter expressions (`timestamp.*`, `duration.*`), matched by prefix so
 * overload resolution stays cheap; and the generated {@link BundledTranslationKey} union — screen
 * reader labels and lookup-table entries that are ordinary prose but reach `t()` as runtime
 * values, leaving nowhere to write a default.
 */
type FormatterKey = `timestamp.${string}` | `duration.${string}` | BundledTranslationKey;

/** Keys whose value is English copy, passed inline as the `defaultValue`. */
type ProseKey = Exclude<TranslationKey, FormatterKey | PluralTranslationKey>;

/**
 * A translation key resolved from a runtime value rather than written literally.
 *
 * The brand is *required*, so a plain `string` is not assignable and the escape hatch has to be
 * taken deliberately via `asDynamicKey()` — which also makes every such site greppable.
 *
 * @example t(asDynamicKey(command.description))
 */
export type DynamicTranslationKey = string & {
  readonly __dynamicTranslationKey: true;
};

/**
 * The SDK's translation function.
 *
 * Every call site passes its English copy inline as i18next's `defaultValue`, so the key stays
 * stable across copy edits and a key missing from a custom dictionary still renders English.
 * Interpolation variables are inferred from that copy, and plural keys require `count`.
 *
 * Deliberately *not* installed via i18next's `CustomTypeOptions`: that augmentation is global and
 * would force an integrator's own unrelated `t()` calls to satisfy the SDK's key union.
 */
export type StreamTFunction = {
  /** Plural key: `count` selects between the `_one` / `_other` copy. */
  <K extends PluralTranslationKey>(
    key: K,
    options: TOptions & { count: number } & InterpolationArgs<CopyFor<K>>,
  ): string;
  /**
   * Formatter key: resolves from the bundled `runtimeDefaults`, so no inline default. Options stay
   * loose — the value is a formatter expression, so inferring its variables is neither useful nor
   * cheap (`CopyFor` over a template-literal key pattern blows the union size limit).
   */
  (key: FormatterKey, options?: TOptions & Record<string, unknown>): string;
  /**
   * Prose key with its English copy inline.
   *
   * Neither `defaultValue` nor `options` is tied to the key's exact copy. Doing so means
   * materialising `CopyFor<ProseKey>` — the union of every copy string in the catalog — which
   * exceeds TypeScript's union size limit (TS2590). The two checks that would buy are covered
   * elsewhere: the default matching the generated catalog is enforced by the drift gate, and
   * missing interpolation variables surface as a literal `{{ placeholder }}` in the rendered
   * output, which the test suite asserts on.
   *
   * Plural keys keep precise typing (see the first overload) because that union is small.
   */
  <K extends ProseKey>(
    key: K,
    defaultValue: string,
    options?: TOptions & Record<string, unknown>,
  ): string;
  /**
   * Escape hatch for keys only known at runtime — a `notification.message` from `stream-chat`,
   * slash-command metadata from the API, or an integrator-supplied prop. The raw string doubles
   * as the default so it still renders verbatim when no translation exists.
   */
  (
    key: DynamicTranslationKey,
    defaultValueOrOptions?: string | (TOptions & Record<string, unknown>),
    options?: TOptions & Record<string, unknown>,
  ): string;
};
