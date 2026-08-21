import { renderHook, waitFor } from '@testing-library/react-native';

import { Streami18n } from '../../utils/i18n/Streami18n';
import { useStreami18n } from '../useStreami18n';

describe('useStreami18n', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  /**
   * `messageInput.sendMessage.accessibilityLabel` is a *bundled* key -- it lives in `runtimeDefaults`
   * with no inline default at its call site -- so it is called with the key alone, and it resolving to
   * German is proof the registered dictionary survived rather than being swapped for a fresh instance.
   *
   * No `instanceof` and no brand check: this repo carries several physical `stream-chat` copies under
   * `nmHoistingLimits: workspaces`, and an integrator's app can resolve another, so any identity test
   * would discard a perfectly good instance along with every dictionary registered on it.
   */
  it('keeps the instance it was given', async () => {
    const i18n = new Streami18n({ language: 'de', logger: () => {} });
    i18n.registerTranslation('de', {
      'messageInput.sendMessage.accessibilityLabel': 'Nachricht senden',
    });
    await i18n.init();

    const { result } = renderHook(() => useStreami18n(i18n));

    await waitFor(() => {
      expect(result.current.t('messageInput.sendMessage.accessibilityLabel')).toBe(
        'Nachricht senden',
      );
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('creates a default instance when given none', async () => {
    const { result } = renderHook(() => useStreami18n());

    await waitFor(() => {
      expect(result.current.t('channel.archived.text', 'Channel archived')).toBe(
        'Channel archived',
      );
    });
  });

  /**
   * The hook is what stands between a rejected `init()` and an unhandled rejection. `init()` is
   * mocked, not the i18next instance under it: core's suite owns *why* it rejects.
   */
  it('reports a failed init() and still renders English', async () => {
    const i18n = new Streami18n({ logger: () => {} });
    jest.spyOn(i18n, 'init').mockRejectedValue(new Error('i18next exploded'));

    const { result } = renderHook(() => useStreami18n(i18n));

    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        'Streami18n failed to initialize',
        expect.objectContaining({ message: 'i18next exploded' }),
      );
    });
    expect(result.current.t('channel.archived.text', 'Channel archived')).toBe('Channel archived');
  });
});
