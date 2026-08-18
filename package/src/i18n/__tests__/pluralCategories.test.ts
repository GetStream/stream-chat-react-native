import PluralRulesPolyfill from 'intl-pluralrules/plural-rules';

import { Streami18n } from '../../utils/i18n/Streami18n';
import type { TranslationDictionary } from '../types';
import { asDynamicKey } from '../utils';

/**
 * Plural selection for languages with more than two categories.
 *
 * `TranslationDictionary` accepts all six `Intl.PluralRules` categories so Arabic, Hebrew and
 * Russian can supply `_zero` / `_two` / `_few` / `_many`. This proves i18next actually selects
 * between them.
 *
 * It runs against the **polyfill** rather than the platform's `Intl`, because that is what runs on
 * a device: `src/index.ts` imports `intl-pluralrules` before anything else, and that polyfill
 * installs itself whenever the native implementation lacks `selectRange` or does not cover the
 * tested locales. Plural selection is therefore a property of this pinned dependency, not of
 * Hermes' Intl build.
 */

const Polyfill =
  (PluralRulesPolyfill as unknown as { default?: typeof Intl.PluralRules }).default ??
  (PluralRulesPolyfill as unknown as typeof Intl.PluralRules);

const KEY = 'poll.votes.text';

const dictionaries: Record<string, { categories: string[]; dictionary: Record<string, string> }> = {
  ar: {
    categories: ['zero', 'one', 'two', 'few', 'many', 'other'],
    dictionary: {
      [`${KEY}_few`]: '{{count}} few',
      [`${KEY}_many`]: '{{count}} many',
      [`${KEY}_one`]: 'one',
      [`${KEY}_other`]: '{{count}} other',
      [`${KEY}_two`]: 'two',
      [`${KEY}_zero`]: 'zero',
    },
  },
  ru: {
    categories: ['one', 'few', 'many', 'other'],
    dictionary: {
      [`${KEY}_few`]: '{{count}} few',
      [`${KEY}_many`]: '{{count}} many',
      [`${KEY}_one`]: '{{count}} one',
      [`${KEY}_other`]: '{{count}} other',
    },
  },
};

describe('plural categories beyond one/other', () => {
  // `Intl.PluralRules` is declared readonly in lib.dom, but the polyfill assigns to it exactly like
  // this at import time — swapping it here reproduces what a device runs.
  const intl = Intl as unknown as { PluralRules: typeof Intl.PluralRules };
  const native = intl.PluralRules;
  beforeAll(() => {
    intl.PluralRules = Polyfill;
  });
  afterAll(() => {
    intl.PluralRules = native;
  });

  it('the bundled polyfill supersedes a native Intl without selectRange', () => {
    // The condition the polyfill itself checks, and the reason Hermes' own Intl does not decide
    // this behaviour.
    expect(typeof Polyfill.prototype.selectRange).toBe('function');
  });

  it.each(Object.entries(dictionaries))(
    '%s exposes its CLDR categories',
    (language, { categories }) => {
      const resolved = new Polyfill(language, { type: 'cardinal' }).resolvedOptions()
        .pluralCategories;
      expect([...resolved].sort()).toEqual([...categories].sort());
    },
  );

  it('selects Arabic zero / one / two / few / many / other', async () => {
    const i18n = new Streami18n({ language: 'ar', logger: () => {} });
    i18n.registerTranslation('ar', dictionaries.ar.dictionary as TranslationDictionary);
    const { t } = await i18n.getTranslators();

    expect(t(asDynamicKey(KEY), { count: 0 })).toBe('zero');
    expect(t(asDynamicKey(KEY), { count: 1 })).toBe('one');
    expect(t(asDynamicKey(KEY), { count: 2 })).toBe('two');
    expect(t(asDynamicKey(KEY), { count: 3 })).toBe('3 few');
    expect(t(asDynamicKey(KEY), { count: 11 })).toBe('11 many');
    expect(t(asDynamicKey(KEY), { count: 100 })).toBe('100 other');
  });

  it('selects Russian one / few / many', async () => {
    const i18n = new Streami18n({ language: 'ru', logger: () => {} });
    i18n.registerTranslation('ru', dictionaries.ru.dictionary as TranslationDictionary);
    const { t } = await i18n.getTranslators();

    expect(t(asDynamicKey(KEY), { count: 1 })).toBe('1 one');
    expect(t(asDynamicKey(KEY), { count: 3 })).toBe('3 few');
    expect(t(asDynamicKey(KEY), { count: 11 })).toBe('11 many');
  });

  it('falls back to English copy for a category the dictionary omits', async () => {
    const i18n = new Streami18n({ language: 'ar', logger: () => {} });
    // Only `_other` supplied — every other category has to render the inline English default.
    i18n.registerTranslation('ar', { [`${KEY}_other`]: '{{count}} صوت' } as TranslationDictionary);
    const { t } = await i18n.getTranslators();

    expect(
      t(asDynamicKey(KEY), {
        count: 1,
        defaultValue_one: '{{count}} vote',
        defaultValue_other: '{{count}} votes',
      }),
    ).toBe('1 vote');
  });
});
