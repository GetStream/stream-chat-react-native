import catalogJson from './catalog.fixture.json';

import { Streami18n } from '../../utils/i18n/Streami18n';
import { EXTERNAL_STRING_KEYS, translateExternalString } from '../externalStrings';
import type { TranslationDictionary } from '../types';

/**
 * The seam for English that `stream-chat` emits.
 *
 * These strings reach `t()` as runtime values, so the extractor never sees them and they cannot be
 * renamed from this repo. Recognised ones resolve through a stable key; anything else has to pass
 * through verbatim, because the alternative is a blank notification when the LLC adds a message.
 */

const catalog = catalogJson as Record<string, string>;

describe('translateExternalString', () => {
  let t: Streami18n['t'];

  beforeAll(async () => {
    const i18n = new Streami18n({ logger: () => {} });
    ({ t } = await i18n.getTranslators());
  });

  it('maps a recognised LLC string onto its key', () => {
    expect(translateExternalString(t, 'Option already exists')).toBe('Option already exists');
  });

  it('renders the registered translation for a mapped string', async () => {
    const i18n = new Streami18n({ language: 'de', logger: () => {} });
    i18n.registerTranslation('de', {
      'poll.createPoll.options.duplicate.error': 'Option existiert bereits',
    } as TranslationDictionary);
    const { t: tDe } = await i18n.getTranslators();

    expect(translateExternalString(tDe, 'Option already exists')).toBe('Option existiert bereits');
  });

  it('passes an unrecognised string through verbatim', () => {
    const unknown = 'Some brand new message the LLC started sending';
    expect(translateExternalString(t, unknown)).toBe(unknown);
  });

  it('returns an empty string for missing input', () => {
    expect(translateExternalString(t, undefined)).toBe('');
    expect(translateExternalString(t, '')).toBe('');
  });

  it('maps only onto keys that exist, with matching copy', () => {
    // The generator enforces this too; asserting it here makes the failure legible when the copy
    // and the mapping drift apart.
    for (const [external, key] of Object.entries(EXTERNAL_STRING_KEYS)) {
      // Array form: `toHaveProperty('a.b.c')` would walk a nested path, and these keys are flat
      // strings that merely contain dots — the same reason `keySeparator` is false.
      expect(catalog).toHaveProperty([key]);
      expect(catalog[key]).toBe(external);
    }
  });
});
