import { parseUrlsFromText } from './parseUrls';

describe('parseUrlsFromText', () => {
  it.each([
    ['www.getstream.io', 'getstream.io'],
    ['getstream.io', 'getstream.io'],
    ['scrn://team-chat', 'team-chat'],
    ['https://localhost', 'localhost'],
    [
      'https://localhost/with/path?and=query&multiple=params',
      'localhost/with/path?and=query&multiple=params',
    ],
    ['https://localhost/with/path?and=query#fragment', 'localhost/with/path?and=query#fragment'],
    ['reactnative.stream', 'reactnative.stream'],
    [
      'https://zh.wikipedia.org/wiki/挪威牛油危機',
      'zh.wikipedia.org/wiki/%E6%8C%AA%E5%A8%81%E7%89%9B%E6%B2%B9%E5%8D%B1%E6%A9%9F',
    ],
    [
      'https://getstream.io/chat/docs/react-native/?language=javascript',
      'getstream.io/chat/docs/react-native/?language=javascript',
    ],
    ['127.0.0.1/local_(development)_server', '127.0.0.1/local_(development)_server'],
    ['https://a.co:8999/ab.php?p=12', 'a.co:8999/ab.php?p=12'],
  ])('Returns the encoded value of %p as %p', (url, expected) => {
    const result = parseUrlsFromText(url);

    expect(result[0].encoded).toBe(expected);
  });

  it.each([
    ['support+rn@getstream.io'],
    ['support.rn@getstream.io'],
    ['support-rn@getstream.io'],
    ['support_rn@getstream.io'],
  ])('Can parse the email address %p', (email) => {
    const result = parseUrlsFromText(email);

    expect(result[0].encoded).toBe(email);
    expect(result[0].protocol).toBe('mailto:');
  });

  it("doesn't double the mailto prefix", () => {
    const input = 'mailto:support@getstream.io';

    const result = parseUrlsFromText(input);

    expect(result[0]).toEqual({
      encoded: 'support@getstream.io',
      protocol: 'mailto:',
      raw: input,
    });
  });

  it('Does not falsely parse URLs from text content', () => {
    const input = `#This string exists to test that we don't produce false positives

Existing links:
[already a parsed link](https://getstream.io/blog/react-native-how-to-build-bidirectional-infinite-scroll/)
[even a bogus one]( should not match )

## These should, however, be parsed:
www.getstream.io
getstream.io
`;
    const result = parseUrlsFromText(input);

    expect(result).toHaveLength(2);
  });

  it('strips out broken emoji from both input and encoded URL', () => {
    const input = 'https://getstream.io/�';

    const result = parseUrlsFromText(input);

    expect(result[0]).toEqual({
      encoded: 'getstream.io/',
      protocol: 'https://',
      raw: 'https://getstream.io/',
    });
  });
});
