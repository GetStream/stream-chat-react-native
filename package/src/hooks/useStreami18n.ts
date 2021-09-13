import { useEffect, useState } from 'react';

import type { TranslationContextValue } from '../contexts/translationContext/TranslationContext';
import { Streami18n } from '../utils/Streami18n';

export const useStreami18n = ({
  i18nInstance,
  setTranslators,
}: {
  setTranslators: React.Dispatch<React.SetStateAction<TranslationContextValue>>;
  i18nInstance?: Streami18n;
}) => {
  const [loadingTranslators, setLoadingTranslators] = useState(true);

  const i18nInstanceExists = !!i18nInstance;
  useEffect(() => {
    let streami18n: Streami18n;

    if (i18nInstance instanceof Streami18n) {
      streami18n = i18nInstance;
    } else {
      streami18n = new Streami18n({ language: 'en' });
    }

    streami18n.registerSetLanguageCallback((t: (key: string) => string) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );
    streami18n.getTranslators().then((translator) => {
      if (translator) setTranslators(translator);
    });

    setLoadingTranslators(false);
  }, [i18nInstanceExists, i18nInstance]);

  return loadingTranslators;
};
