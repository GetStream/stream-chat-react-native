import { runtimeDefaults } from '../../i18n/runtimeDefaults';

describe('Jest Timezone', () => {
  it('global config should set the timezone to UTC', () => {
    expect(new Date().getTimezoneOffset()).toBe(0);
  });
});

describe('runtimeDefaults', () => {
  it('carries per-key calendarFormats for exactly the two documented keys', () => {
    // A per-key `calendarFormats` replaces the dayjs locale's calendar wholesale, so
    // `dayjsLocaleConfigForLanguage` never reaches these two — they have to be overridden key by
    // key. Adding a third silently strands English day words in a translated app, so it has to
    // fail here first and be documented.
    const withCalendarFormats = Object.entries(runtimeDefaults)
      .filter(([, value]) => value.includes('calendarFormats:'))
      .map(([key]) => key)
      .sort();

    expect(withCalendarFormats).toStrictEqual([
      'timestamp.ChannelPreviewStatus',
      'timestamp.ThreadListItem',
    ]);
  });

  it('holds English inside a formatter expression for exactly the three documented keys', () => {
    // The broader version of the guard above. A bundled formatter value can hide English in two
    // places: inside a `calendarFormats` bracket literal (`[Yesterday]`), or as prose sitting
    // beside the interpolation (`Last seen {{ … }}`). Either way `dayjsLocaleConfigForLanguage`
    // cannot reach it and the key has to be overridden by hand, so the set has to stay closed.
    // A formatter value pipes through a named formatter. Matched by substring rather than a
    // balanced-brace regex, because `calendarFormats:` embeds a JSON object and the inner braces
    // defeat the obvious pattern.
    const isFormatterExpression = (value: string) => value.includes('{{') && value.includes('|');

    const englishInsideFormatter = Object.entries(runtimeDefaults)
      // Only formatter values. Ordinary bundled prose like 'Avatar of {{name}}' is translated by
      // overriding the key like any other string; these are format specs that happen to embed copy.
      .filter(([, value]) => isFormatterExpression(value))
      .filter(([, value]) => {
        const outsideInterpolation = value.replace(/\{\{[^}]*\}\}/g, '');
        const insideBrackets = [...value.matchAll(/\[([A-Za-z][^\]]*)\]/g)].map((m) => m[1]);
        return /[A-Za-z]/.test(outsideInterpolation) || insideBrackets.length > 0;
      })
      .map(([key]) => key)
      .sort();

    expect(englishInsideFormatter).toStrictEqual([
      'timestamp.ChannelPreviewStatus',
      'timestamp.ThreadListItem',
      'timestamp.UserActivityStatus',
    ]);
  });
});
