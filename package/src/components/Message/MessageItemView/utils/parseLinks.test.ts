import { parseLinksFromText } from './parseLinks';

describe('parseLinksFromText', () => {
  it.each([
    ['https://www.getstream.io', 'https://www.getstream.io'],
    ['https://getstream.io', 'https://getstream.io'],
    ['scrn://team-chat', undefined],
    ['https://localhost', 'https://localhost'],
    [
      'https://localhost/with/path?and=query&multiple=params',
      'https://localhost/with/path?and=query&multiple=params',
    ],
    [
      'https://localhost/with/path?and=query#fragment',
      'https://localhost/with/path?and=query#fragment',
    ],
    ['reactnative.dev', 'http://reactnative.dev'],
    ['hinge.health/schedule-with-a-coach', 'http://hinge.health/schedule-with-a-coach'],
    ['https://zh.wikipedia.org/wiki/挪威牛油危機', 'https://zh.wikipedia.org/wiki/挪威牛油危機'],
    [
      'https://getstream.io/chat/docs/react-native/?language=javascript',
      'https://getstream.io/chat/docs/react-native/?language=javascript',
    ],
    ['127.0.0.1/local_(development)_server', undefined],
    ['https://a.co:8999/ab.php?p=12', 'https://a.co:8999/ab.php?p=12'],
    [
      'https://help.apple.com/xcode/mac/current/#/devba7f53ad4',
      'https://help.apple.com/xcode/mac/current/#/devba7f53ad4',
    ],
    ['[google.com](https://www.google.com)', undefined],
    ['[https://www.google.com](https://www.google.com)', undefined],
    ['[abc]()', undefined],
    ['[](https://www.google.com)', undefined],
    ['slack:some-slack', undefined],
  ])('Returns the encoded value of %p as %p', (link, expected) => {
    const result = parseLinksFromText(link);
    expect(result[0]?.url).toBe(expected);
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
        raw: 'https://www.contrived-example.com:8080/sub/page.php?p1=1🇳🇴&p2=2#fragment-identifier',
        url: 'https://www.contrived-example.com:8080/sub/page.php?p1=1🇳🇴&p2=2#fragment-identifier',
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
    expect(result[0].url).toBe('mailto:' + email);
    expect(result[0].raw).toBe(email);
  });
  it("doesn't double the mailto prefix", () => {
    const input = 'mailto:support@getstream.io';
    const result = parseLinksFromText(input);
    expect(result[0]).toEqual({
      raw: input,
      url: input,
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
      raw: input,
      url: 'https://getstream.io/�',
    });
  });
});
