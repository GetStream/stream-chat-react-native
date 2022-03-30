import { parseLinksFromText } from './parseLinks';

describe('parseLinksFromText', () => {
  it.each([
    ['www.getstream.io', 'www.getstream.io'],
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
  ])('Returns the encoded value of %p as %p', (link, expected) => {
    const result = parseLinksFromText(link);

    expect(result[0].encoded).toBe(expected);
  });

  it('parses fqdn', () => {
    const input = `We have put the apim bol,
temporarily so :sj: we can later put the monitors on my grasp
on reality right now is
https://www.contrived-example.com:8080/sub/page.php?p1=1🇳🇴&p2=2#fragment-identifier
:)`;

    const result = parseLinksFromText(input);

    expect(result).toEqual([
      {
        encoded:
          'www.contrived-example.com:8080/sub/page.php?p1=1%F0%9F%87%B3%F0%9F%87%B4&p2=2#fragment-identifier',
        raw: 'https://www.contrived-example.com:8080/sub/page.php?p1=1🇳🇴&p2=2#fragment-identifier',
        scheme: 'https://',
      },
    ]);
  });

  it.each([
    ['support+rn@getstream.io'],
    ['support.rn@getstream.io'],
    ['support-rn@getstream.io'],
    ['support_rn@getstream.io'],
  ])('Can parse the email address %p', (email) => {
    const result = parseLinksFromText(email);

    expect(result[0].encoded).toBe(email);
    expect(result[0].scheme).toBe('mailto:');
  });

  it("doesn't double the mailto prefix", () => {
    const input = 'mailto:support@getstream.io';

    const result = parseLinksFromText(input);

    expect(result[0]).toEqual({
      encoded: 'support@getstream.io',
      raw: input,
      scheme: 'mailto:',
    });
  });

  it('Does not falsely parse LINKs from text content', () => {
    const input = `#This string exists to test that we don't produce false positives

Existing links:
[already a parsed link](https://getstream.io/blog/react-native-how-to-build-bidirectional-infinite-scroll/)
[even a bogus one]( should not match )

## These should, however, be parsed:
www.getstream.io
getstream.io
`;
    const result = parseLinksFromText(input);

    expect(result).toHaveLength(2);
  });

  it('Encodes incomplete emoji unicode', () => {
    const input = 'https://getstream.io/�';
    const result = parseLinksFromText(input);

    expect(result[0]).toEqual({
      encoded: 'getstream.io/%EF%BF%BD',
      raw: 'https://getstream.io/�',
      scheme: 'https://',
    });
  });

  it('does not parse a decimal number as a URL', () => {
    const input = '123.456';
    const result = parseLinksFromText(input);

    expect(result).toHaveLength(0);
  });
});
