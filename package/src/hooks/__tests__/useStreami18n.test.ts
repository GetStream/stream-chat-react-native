import { renderHook, waitFor } from '@testing-library/react-native';

import { Streami18n } from '../../utils/i18n/Streami18n';
import { useStreami18n } from '../useStreami18n';

/**
 * The instance-recognition contract.
 *
 * `instanceof` is not usable here — this repo carries several physical `stream-chat` copies under
 * `nmHoistingLimits: workspaces`, and an integrator's app can resolve another — so recognition goes
 * through a `Symbol.for` brand. What matters is that the brand is compared for *identity*: testing it
 * for truthiness would admit any class with a static named `brand`, which then reaches `init()` and
 * throws at render rather than falling back with a warning.
 */
describe('useStreami18n', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('keeps the instance it was given', async () => {
    const i18n = new Streami18n({ language: 'de', logger: () => {} });
    i18n.registerTranslation('de', {
      'messageInput.sendMessage.accessibilityLabel': 'Nachricht senden',
    });
    await i18n.init();

    const { result } = renderHook(() => useStreami18n(i18n));

    await waitFor(() => {
      expect(result.current.t('messageInput.sendMessage.accessibilityLabel', 'Send message')).toBe(
        'Nachricht senden',
      );
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('accepts an instance from another copy of the package', async () => {
    const i18n = new Streami18n({ language: 'de', logger: () => {} });
    i18n.registerTranslation('de', {
      'messageInput.sendMessage.accessibilityLabel': 'Nachricht senden',
    });
    await i18n.init();

    // A distinct constructor carrying the same registered brand — what a second `stream-chat` copy
    // produces. `instanceof` would reject this and silently discard every registered dictionary.
    //
    // Only `constructor` is swapped, not the prototype: the instance has to keep its real methods,
    // which is exactly the situation across two copies.
    class OtherCopyStreami18n {
      static readonly brand = Symbol.for('stream-chat.Streami18n');
    }
    Object.defineProperty(i18n, 'constructor', { value: OtherCopyStreami18n });

    const { result } = renderHook(() => useStreami18n(i18n));

    await waitFor(() => {
      expect(result.current.t('messageInput.sendMessage.accessibilityLabel', 'Send message')).toBe(
        'Nachricht senden',
      );
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('rejects an unrelated class that happens to have a `brand` static, and warns', async () => {
    class NotStreami18n {
      static readonly brand = 'some-other-library';
    }

    const { result } = renderHook(() =>
      useStreami18n(new NotStreami18n() as unknown as Streami18n),
    );

    // Fell back to a fresh default rather than throwing on `.init()` / `.state`.
    await waitFor(() => {
      expect(result.current.t('messageInput.sendMessage.accessibilityLabel', 'Send message')).toBe(
        'Send message',
      );
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('is not a Streami18n'));
  });
});
