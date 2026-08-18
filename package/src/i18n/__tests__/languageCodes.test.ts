import { Streami18n } from '../../utils/i18n/Streami18n';
import type { TranslationDictionary } from '../types';

/**
 * Language-code handling.
 *
 * `keySeparator` and `nsSeparator` are both false and keys are flat dotted strings, so a
 * region-coded language (`pt-BR`) must not be mistaken for a namespace or a key path. This SDK
 * shipped a `pt-BR` locale until v10, so an integrator porting that dictionary forward is the most
 * likely first user of this path.
 */

const silent = { logger: () => {} };

describe('language codes', () => {
  it.each(['pt-BR', 'zh-TW', 'fr-CA', 'es-MX'])(
    'resolves a dictionary for %s',
    async (language) => {
      const i18n = new Streami18n({ ...silent, language });
      i18n.registerTranslation(language, {
        'common.cancel.label': `cancel-${language}`,
      } as TranslationDictionary);
      const { t } = await i18n.init();

      expect(t('common.cancel.label', 'Cancel')).toBe(`cancel-${language}`);
      // The hyphen must not have been read as a separator of any kind.
      expect(i18n.currentLanguage).toBe(language);
      expect(i18n.getAvailableLanguages()).toContain(language);
    },
  );

  it('keeps a region-coded language distinct from its base language', async () => {
    const i18n = new Streami18n({ ...silent, language: 'pt-BR' });
    i18n.registerTranslation('pt', {
      'common.cancel.label': 'Cancelar-pt',
    } as TranslationDictionary);
    i18n.registerTranslation('pt-BR', {
      'common.cancel.label': 'Cancelar-ptBR',
    } as TranslationDictionary);
    const { t } = await i18n.init();

    expect(t('common.cancel.label', 'Cancel')).toBe('Cancelar-ptBR');
  });

  it('still renders bundled formatter keys under a region-coded language', async () => {
    const i18n = new Streami18n({ ...silent, language: 'pt-BR' });
    const { t } = await i18n.init();

    // Would be the raw key if runtimeDefaults had not been layered under `pt-BR`.
    expect(t('timestamp.MessageTimestamp', { timestamp: new Date(0) })).not.toBe(
      'timestamp.MessageTimestamp',
    );
  });
});

describe('setLanguage', () => {
  it('swaps the active language on the same instance', async () => {
    const i18n = new Streami18n({ ...silent, language: 'en' });
    i18n.registerTranslation('de', { 'common.cancel.label': 'Abbrechen' } as TranslationDictionary);

    const { t: before } = await i18n.init();
    expect(before('common.cancel.label', 'Cancel')).toBe('Cancel');

    await i18n.setLanguage('de');

    // The instance identity is unchanged — the SDK swaps language in place rather than requiring a
    // new `Streami18n` (which would mean remounting `<Chat>`).
    const { t: after } = await i18n.init();
    expect(i18n.currentLanguage).toBe('de');
    expect(after('common.cancel.label', 'Cancel')).toBe('Abbrechen');
  });

  it('publishes the new t to the state store on a language change', async () => {
    const i18n = new Streami18n({ ...silent, language: 'en' });
    i18n.registerTranslation('de', { 'common.cancel.label': 'Abbrechen' } as TranslationDictionary);
    await i18n.init();

    const seen: string[] = [];
    // Replaces `addOnLanguageChangeListener`. `subscribeWithSelector` fires synchronously with the
    // current value first, hence the English entry -- and that synchronous first call is the point:
    // a consumer subscribing after `init()` still gets a live `t` with no ordering to get wrong.
    const unsubscribe = i18n.state.subscribeWithSelector(
      ({ t }) => ({ t }),
      ({ t }) => seen.push(t('common.cancel.label', 'Cancel')),
    );

    await i18n.setLanguage('de');
    unsubscribe();

    // This is what re-renders the tree: the store's `t` is replaced, not the provider.
    expect(seen).toEqual(['Cancel', 'Abbrechen']);
  });

  it('warns but keeps the language when it has no dictionary', async () => {
    const logger = jest.fn();
    const i18n = new Streami18n({ language: 'en', logger });
    await i18n.init();

    await i18n.setLanguage('ja');

    expect(i18n.currentLanguage).toBe('ja');
    expect(logger).toHaveBeenCalledWith(
      expect.stringMatching(/no translation dictionary is registered/i),
    );
  });
});
