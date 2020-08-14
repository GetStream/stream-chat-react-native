import { useEffect } from 'react';

import { Streami18n } from '../../../utils/Streami18n';

export const useStreami18n = ({ i18nInstance, setTranslators }) => {
  useEffect(() => {
    let streami18n;

    if (i18nInstance instanceof Streami18n) {
      streami18n = i18nInstance;
    } else {
      streami18n = new Streami18n({ language: 'en' });
    }

    streami18n.registerSetLanguageCallback((t) =>
      setTranslators((prevTranslator) => ({ ...prevTranslator, t })),
    );
    streami18n.getTranslators().then((translator) => {
      if (translator) setTranslators(translator);
    });
  }, [i18nInstance]);
};
