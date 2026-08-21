import { useEffect, useMemo } from 'react';

import type { Streami18nState } from 'stream-chat/i18n';

import { useStateStore } from './useStateStore';

import type { TranslatorFunctions } from '../contexts/translationContext/types';
import type { BundledTranslationKey } from '../i18n/keys';
import type { TranslationCatalog } from '../i18n/types';
import { Streami18n } from '../utils/i18n/Streami18n';

/**
 * This SDK's instantiation of core's state shape.
 *
 * Spelled out rather than left to `Streami18nState`'s defaults: those default the catalog to
 * `AnyTranslationCatalog`, and `t` is contravariant in its options, so the concrete store is not
 * assignable to the default-parameterized one.
 */
type SDKStreami18nState = Streami18nState<TranslationCatalog, BundledTranslationKey>;

/**
 * Whether a value is a `Streami18n` from any copy of the package.
 *
 * `instanceof` is deliberately avoided. Under `nmHoistingLimits: workspaces` this repo carries several
 * physical `stream-chat` copies, and an integrator's app can easily resolve another — in which case an
 * `instanceof` check fails and the instance they configured is *silently discarded* for a fresh English
 * default. Every registered dictionary, formatter and language goes with it, with no error anywhere. A
 * branded static survives across copies, because `Symbol.for` returns the same symbol in every one.
 *
 * Compared against `Streami18n.brand` rather than tested for truthiness: `brand` is a common static
 * name, and accepting any truthy one would let an unrelated class through to `init()` and throw at
 * render instead of taking the warn-and-fall-back path below.
 */
const isStreami18n = (value: unknown): value is Streami18n =>
  typeof value === 'object' &&
  value !== null &&
  (value.constructor as typeof Streami18n | undefined)?.brand === Streami18n.brand;

/** Module-scope so the subscription is not torn down and rebuilt on every render. */
const selector = ({ t, tDateTimeParser }: SDKStreami18nState) => ({ t, tDateTimeParser });

export const useStreami18n = (i18nInstance?: Streami18n): TranslatorFunctions => {
  const streami18n = useMemo(() => {
    if (!i18nInstance) return new Streami18n();
    if (isStreami18n(i18nInstance)) return i18nInstance;
    // Loud, because the alternative is rendering English and looking fine.
    console.warn(
      'stream-chat-react-native: the value passed as `i18nInstance` is not a Streami18n, so it was ' +
        'ignored and a default English instance is being used. If you did construct one, check for a ' +
        'duplicate `stream-chat` in node_modules.',
    );
    return new Streami18n();
  }, [i18nInstance]);

  /**
   * `init()` rejects if i18next fails to initialize, so the rejection is handled here rather than
   * left to surface as an unhandled rejection from an effect.
   *
   * Reported through the instance's own `logger`, which is where an integrator has already routed
   * diagnostics. Nothing is thrown onward and no error state is rendered, because core leaves the
   * instance degraded but safe: `t` still returns each call site's inline English, so the chat renders
   * in English rather than blanking or showing dotted keys. Failing the whole subtree over a
   * translation-layer fault would be the worse outcome.
   */
  useEffect(() => {
    streami18n.init().catch((error: unknown) => {
      streami18n.logger(
        `stream-chat-react-native: Streami18n failed to initialize, falling back to the bundled English copy: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    });
  }, [streami18n]);

  // One subscription replaces the two listener registrations this used to make. `subscribe` fires
  // synchronously with the current value, so whether this runs before or after `init()` the live `t`
  // arrives -- which is what the queued-override handling existed to work around.
  return useStateStore(streami18n.state, selector) as TranslatorFunctions;
};
