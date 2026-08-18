import { useEffect, useMemo } from 'react';

import type { StreamI18nState } from 'stream-chat/i18n';

import { useStateStore } from './useStateStore';

import type { TranslatorFunctions } from '../contexts/translationContext/types';
import type { BundledTranslationKey } from '../i18n/keys';
import type { TranslationCatalog } from '../i18n/types';
import { StreamI18n } from '../utils/i18n/Streami18n';

/**
 * This SDK's instantiation of core's state shape.
 *
 * Spelled out rather than left to `StreamI18nState`'s defaults: those default the catalog to
 * `AnyTranslationCatalog`, and `t` is contravariant in its options, so the concrete store is not
 * assignable to the default-parameterized one.
 */
type SDKStreamI18nState = StreamI18nState<TranslationCatalog, BundledTranslationKey>;

/**
 * Whether a value is a `StreamI18n` from any copy of the package.
 *
 * `instanceof` is deliberately avoided. Under `nmHoistingLimits: workspaces` this repo carries several
 * physical `stream-chat` copies, and an integrator's app can easily resolve another — in which case an
 * `instanceof` check fails and the instance they configured is *silently discarded* for a fresh English
 * default. Every registered dictionary, formatter and language goes with it, with no error anywhere. A
 * branded static survives across copies.
 */
const isStreamI18n = (value: unknown): value is StreamI18n =>
  typeof value === 'object' &&
  value !== null &&
  Boolean((value.constructor as typeof StreamI18n | undefined)?.brand);

/** Module-scope so the subscription is not torn down and rebuilt on every render. */
const selector = ({ t, tDateTimeParser }: SDKStreamI18nState) => ({ t, tDateTimeParser });

export const useStreami18n = (i18nInstance?: StreamI18n): TranslatorFunctions => {
  const streamI18n = useMemo(() => {
    if (!i18nInstance) return new StreamI18n();
    if (isStreamI18n(i18nInstance)) return i18nInstance;
    // Loud, because the alternative is rendering English and looking fine.
    console.warn(
      'stream-chat-react-native: the value passed as `i18nInstance` is not a StreamI18n, so it was ' +
        'ignored and a default English instance is being used. If you did construct one, check for a ' +
        'duplicate `stream-chat` in node_modules.',
    );
    return new StreamI18n();
  }, [i18nInstance]);

  useEffect(() => {
    streamI18n.init();
  }, [streamI18n]);

  // One subscription replaces the two listener registrations this used to make. `subscribe` fires
  // synchronously with the current value, so whether this runs before or after `init()` the live `t`
  // arrives -- which is what the queued-override handling existed to work around.
  return useStateStore(streamI18n.state, selector) as TranslatorFunctions;
};
