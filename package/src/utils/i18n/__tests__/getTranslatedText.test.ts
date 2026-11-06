import { getTranslatedText } from '../getTranslatedText';

describe('getTranslatedText', () => {
  const i18n = { de_text: 'Wie geht es?', language: 'en' };

  it('returns the translation into the given language', () => {
    expect(getTranslatedText(i18n, 'de')).toBe('Wie geht es?');
  });

  it('returns undefined when there is no translation into the given language', () => {
    expect(getTranslatedText(i18n, 'fr')).toBeUndefined();
  });

  it('returns undefined when the text has no translations', () => {
    expect(getTranslatedText(undefined, 'de')).toBeUndefined();
  });
});
