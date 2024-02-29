import { useEffect, useState } from 'react';

import Dayjs from 'dayjs';

import { useIsMountedRef } from './useIsMountedRef';

import type { TranslatorFunctions } from '../contexts/translationContext/TranslationContext';
import { Streami18n } from '../utils/Streami18n';

export const useStreami18n = (i18nInstance?: Streami18n) => {
  const [translators, setTranslators] = useState<TranslatorFunctions>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });
  const isMounted = useIsMountedRef();

  useEffect(() => {
    let streami18n: Streami18n;

    if (i18nInstance instanceof Streami18n) {
      streami18n = i18nInstance;
    } else {
      streami18n = new Streami18n({ language: 'en' });
    }

    const updateTFunction = (t: TranslatorFunctions['t']) => {
      setTranslators((prevTranslator) => ({ ...prevTranslator, t }));
    };

    const { unsubscribe: unsubscribeOnLanguageChangeListener } =
      streami18n.addOnLanguageChangeListener((t) => {
        updateTFunction(t);
      });

    const { unsubscribe: unsubscribeOnTFuncOverrideListener } =
      streami18n.addOnTFunctionOverrideListener((t) => {
        updateTFunction(t);
      });

    streami18n.getTranslators().then((translator) => {
      if (translator && isMounted.current) setTranslators(translator);
    });

    return () => {
      unsubscribeOnTFuncOverrideListener();
      unsubscribeOnLanguageChangeListener();
    };
  }, [i18nInstance]);

  return translators;
};
