import { runtimeDefaults } from '../../i18n/runtimeDefaults';
import type { TranslationDictionary } from '../../i18n/types';
import { Streami18n } from '../i18n/Streami18n';

/**
 * The three behavioural guarantees the v15 i18n architecture has to hold. Each one was a real bug
 * found in review of the web implementation, and each one reproduces against this SDK's
 * pre-port `Streami18n`.
 *
 * G1 — every language is layered over `runtimeDefaults`, however it was selected.
 * G2 — a partial dictionary is safe: unsupplied keys render English, never a raw dotted path.
 * G3 — selecting an unregistered language warns and continues; it must not silently reset to `en`.
 */

const silent = { logger: () => {} };

// A formatter key: bundled data, no inline default anywhere. If runtimeDefaults is not layered in,
// this renders as the literal key.
const FORMATTER_KEY = 'timestamp.MessageTimestamp';

describe('G1 — runtimeDefaults are layered under every language', () => {
  it('applies to a language selected via the `language` option', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    const { t } = await i18n.getTranslators();

    expect(t(FORMATTER_KEY)).not.toBe(FORMATTER_KEY);
  });

  it('applies to a language added with registerTranslation', async () => {
    const i18n = new Streami18n(silent);
    i18n.registerTranslation('de', {
      'common.cancel.label': 'Abbrechen',
    } satisfies TranslationDictionary);
    await i18n.setLanguage('de');
    const { t } = await i18n.getTranslators();

    expect(t(FORMATTER_KEY)).not.toBe(FORMATTER_KEY);
  });

  it('applies to `en` when no dictionary is supplied at all', async () => {
    const i18n = new Streami18n(silent);
    const { t } = await i18n.getTranslators();

    expect(t(FORMATTER_KEY)).not.toBe(FORMATTER_KEY);
  });

  it('survives registerTranslation for a language that already had one', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    i18n.registerTranslation('de', {
      'common.cancel.label': 'Abbrechen',
    } satisfies TranslationDictionary);
    i18n.registerTranslation('de', { 'common.draft.label': 'Entwurf' });
    const { t } = await i18n.getTranslators();

    // Registering twice must accumulate, and must not knock out the bundled formatter keys.
    expect(t(FORMATTER_KEY)).not.toBe(FORMATTER_KEY);
  });

  it('never lets an integrator dictionary shadow a bundled key by omission', async () => {
    const i18n = new Streami18n({
      ...silent,
      language: 'de',
      translationsForLanguage: { 'common.cancel.label': 'Abbrechen' },
    });
    const { t } = await i18n.getTranslators();

    expect(t(FORMATTER_KEY)).toBe(runtimeDefaults[FORMATTER_KEY]);
  });
});

describe('G2 — a partial dictionary renders English, not a dotted path', () => {
  it('renders the inline default for a key the dictionary does not supply', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    i18n.registerTranslation('de', {
      'common.cancel.label': 'Abbrechen',
    } satisfies TranslationDictionary);
    const { t } = await i18n.getTranslators();

    expect(t('common.loading.text', 'Loading...')).toBe('Loading...');
  });

  it('renders the supplied translation when the dictionary does supply it', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    i18n.registerTranslation('de', {
      'common.cancel.label': 'Abbrechen',
    } satisfies TranslationDictionary);
    const { t } = await i18n.getTranslators();

    expect(t('common.cancel.label', 'Cancel')).toBe('Abbrechen');
  });

  it('never renders a raw dotted key for a prose key', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    const { t } = await i18n.getTranslators();

    const rendered = t('common.loading.text', 'Loading...');
    expect(rendered).not.toMatch(/^[a-z][a-zA-Z]*(\.[a-zA-Z]+)+$/);
  });

  it('does not let an integrator parseMissingKeyHandler blank out prose keys', async () => {
    const i18n = new Streami18n(silent, { parseMissingKeyHandler: () => '' } as never);
    const { t } = await i18n.getTranslators();

    // Every prose key looks "missing" to i18next — it resolves from the inline default, not from
    // the resource bundle. An unguarded handler therefore blanks out most of the UI.
    expect(t('common.loading.text', 'Loading...')).toBe('Loading...');
  });
});

describe('G3 — an unregistered language warns and continues', () => {
  it('does not silently reset the language to en', async () => {
    const logger = jest.fn();
    const i18n = new Streami18n({ language: 'de', logger });
    await i18n.getTranslators();

    expect(i18n.currentLanguage).toBe('de');
  });

  it('warns that the language has no dictionary', async () => {
    const logger = jest.fn();
    const i18n = new Streami18n({ language: 'de', logger });
    await i18n.getTranslators();

    // Specifically the *translation* warning — not the unrelated dayjs "locale config for de does
    // not exist" message, which the pre-port code already emits and which would let this pass for
    // the wrong reason.
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('registerTranslation'));
    expect(logger).toHaveBeenCalledWith(
      expect.stringMatching(/no translation dictionary is registered/i),
    );
  });

  it('keeps the language after setLanguage to an unregistered one', async () => {
    const logger = jest.fn();
    const i18n = new Streami18n({ logger });
    await i18n.getTranslators();
    await i18n.setLanguage('de');

    expect(i18n.currentLanguage).toBe('de');
  });

  it('still renders English copy in the unregistered language', async () => {
    const i18n = new Streami18n({ ...silent, language: 'de' });
    const { t } = await i18n.getTranslators();

    expect(t('common.loading.text', 'Loading...')).toBe('Loading...');
  });
});
