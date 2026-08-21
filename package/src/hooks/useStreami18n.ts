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

/** Module-scope so the subscription is not torn down and rebuilt on every render. */
const selector = ({ t, tDateTimeParser }: SDKStreami18nState) => ({ t, tDateTimeParser });

export const useStreami18n = (i18nInstance?: Streami18n): TranslatorFunctions => {
  const streami18n = useMemo(() => i18nInstance ?? new Streami18n(), [i18nInstance]);
  useEffect(() => {
    streami18n.init().catch((error: unknown) => {
      console.warn('Streami18n failed to initialize', error);
    });
  }, [streami18n]);

  return useStateStore(streami18n.state, selector) as TranslatorFunctions;
};
