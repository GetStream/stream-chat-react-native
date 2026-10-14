import { escapeRegExp, generateMarkdownText, parseLinksFromText } from '../markdown';

describe('ai-components generateMarkdownText', () => {
  it('returns null for empty input', () => {
    expect(generateMarkdownText(undefined)).toBeNull();
    expect(generateMarkdownText('')).toBeNull();
  });

  it('converts a raw link into a markdown link', () => {
    expect(generateMarkdownText('Visit getstream.io today')).toBe(
      'Visit [getstream.io](http://getstream.io) today',
    );
  });

  // Regression: every link used to be replaced on the original text, so only the last one survived.
  it('converts every raw link in the text', () => {
    expect(generateMarkdownText('See getstream.io and reactnative.dev')).toBe(
      'See [getstream.io](http://getstream.io) and [reactnative.dev](http://reactnative.dev)',
    );
  });

  it('keeps emails as mailto links', () => {
    expect(generateMarkdownText('Mail hello@getstream.io')).toBe(
      'Mail [hello@getstream.io](mailto:hello@getstream.io)',
    );
  });

  it('closes an unterminated code fence', () => {
    const result = generateMarkdownText('Code:\n```js\nconst a = 1;');
    expect((result?.match(/```/g) ?? []).length % 2).toBe(0);
  });

  it('collapses indentation after newlines but keeps nested list indentation', () => {
    expect(generateMarkdownText('Line one\n    indented line')).toBe('Line one\nindented line');
    expect(generateMarkdownText('- parent\n  - child')).toBe('- parent\n  - child');
  });

  it('preserves code blocks verbatim', () => {
    const result = generateMarkdownText('```py\ndef f():\n    return 1\n```');
    expect(result).toContain('def f():\n    return 1');
  });

  it('parses links and emails, ignoring markdown links', () => {
    expect(parseLinksFromText('a getstream.io b [x](https://example.com) c me@x.io')).toEqual([
      { raw: 'getstream.io', url: 'http://getstream.io' },
      { raw: 'me@x.io', url: 'mailto:me@x.io' },
    ]);
    expect(parseLinksFromText(undefined)).toEqual([]);
  });

  it('escapes regular expression characters', () => {
    expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c');
  });
});
