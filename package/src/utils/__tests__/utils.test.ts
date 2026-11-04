import { formatMsToMinSec, getInitialsFromName, getUrlWithoutParams } from '../utils';

describe('getInitialsFromName', () => {
  it('should return the uppercased first letter of the first two words', () => {
    expect(getInitialsFromName('ivan sekovanikj')).toBe('IS');
    expect(getInitialsFromName('  Jane   Mary Doe ')).toBe('JM');
    expect(getInitialsFromName('Jane Mary Doe', 3)).toBe('JMD');
    expect(getInitialsFromName('Jane')).toBe('J');
  });

  it('should return an empty string for empty or blank names', () => {
    expect(getInitialsFromName('')).toBe('');
    expect(getInitialsFromName('   ')).toBe('');
  });

  it('should keep characters outside the Basic Multilingual Plane intact', () => {
    expect(getInitialsFromName('😀 Smiley')).toBe('😀S');
    expect(getInitialsFromName('𝒜lice Bob')).toBe('𝒜B');
  });

  it('should keep emoji sequences intact', () => {
    expect(getInitialsFromName('👍🏽 Thumb')).toBe('👍🏽T');
    expect(getInitialsFromName('🇺🇸 Flag')).toBe('🇺🇸F');
    expect(getInitialsFromName('🇺🇸🇬🇧 Flags')).toBe('🇺🇸F');
    expect(getInitialsFromName('👨‍👩‍👧 Family')).toBe('👨‍👩‍👧F');
    expect(getInitialsFromName('❤️ Heart')).toBe('❤️H');
    expect(getInitialsFromName('🏴󠁧󠁢󠁥󠁮󠁧󠁿 England')).toBe('🏴󠁧󠁢󠁥󠁮󠁧󠁿E');
  });

  it('should bound the length of a pathological emoji sequence', () => {
    const initials = getInitialsFromName(`${'👨‍👩‍👧'.repeat(2000)} x`);

    expect(initials.length).toBeLessThanOrEqual(33);
    expect(initials.endsWith('X')).toBe(true);
  });

  it('should take the first code unit of words that do not start with an emoji', () => {
    expect(getInitialsFromName('Иван Петров')).toBe('ИП');
    expect(getInitialsFromName('大学 同学')).toBe('大同');
    expect(getInitialsFromName('1️⃣ One')).toBe('1O');
  });
});

describe('getUrlWithoutParams', () => {
  const testUrlMap: Record<string, string> = {
    'http://foo.com/blah_(wikipedia)#cite-1': 'http://foo.com/blah_(wikipedia)#cite-1',
    'https://us-east.stream-io-cdn.com/102401/images/418dc024-b587-48cd-84fb-252418e14391.FB_IMG_1633228094526.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzEwMjQwMS9pbWFnZXMvNDE4ZGMwMjQtYjU4Ny00OGNkLTg0ZmItMjUyNDE4ZTE0MzkxLkZCX0lNR18xNjMzMjI4MDk0NTI2LmpwZz9jcm9wPSomaD0qJnJlc2l6ZT0qJnJvPTAmdz0qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjM1MTUwMDM5fX19XX0_&Signature=Yi8XTsAVYiEh2IDSkH4IK1zNEvPvgUkfYx9oJb2VrJMMVrBz2oPurbcFOHuQSk74RQTSE6LPZ-wplayHZxaSVeX4Q6IwwjE7vmnU~-UYPttxnClpRWFUKLJx79auz5sjkhwFte7uzby7oQSRRDRl3g3ritN~NRzU4cjZ0tnLFnn0AwnLDmfEk8VdjgGXm84PeqpAUujyDmSqm1TY7QJQBRnJMQ-MV7AA3Gj8ec9yxWunIOK8xn5FJTRvKAVqEcu~lnmEAMS5RXQ5oDCjp2~w7M7sNSyqgJVe7jRJ0kctRqJeOPlsDfQJB38JwLv6v-5piSt2kTYsPBXUu4EiALwVaQ__&crop=*&h=*&resize=*&ro=0&w=*':
      'https://us-east.stream-io-cdn.com/102401/images/418dc024-b587-48cd-84fb-252418e14391.FB_IMG_1633228094526.jpg',
    'https://us-east.stream-io-cdn.com/62344/images/69c62680-45ba-4c6c-af49-66f3acee39cf.C8B8DF8D-A326-44A6-8030-C2B1C61116A5.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzYyMzQ0L2ltYWdlcy82OWM2MjY4MC00NWJhLTRjNmMtYWY0OS02NmYzYWNlZTM5Y2YuQzhCOERGOEQtQTMyNi00NEE2LTgwMzAtQzJCMUM2MTExNkE1LmpwZz9jcm9wPSomaD0qJnJlc2l6ZT0qJnJvPTAmdz0qIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjE3OTU5MTk2fX19XX0_&Signature=b0DMJSOQmRO2AMemtlo-yhnUNuPtwC90QG5kn23Oaw13o8jlcFs93i2NgDarmJzanjHgOBsqv6dc-troCV2tTfUIz77CeAPjMXvPjmrUUgHUsBJrdr5DbjnhjfFIC9MTJxV9qkJNsD22M0qdR8MHzhHPNF~ZD76M-e~JZ7QuiUOG9Nw1YscXnYxn0x1RDjm8jKObPd0T3qTqPAADbfIYSxAxrInnUAj5CtYMyTVsV2zyxJpWfzm6gYs5lW0mvPUuCQ77AECTGiHCrfxdRI8LJFEmxrr1-KC8iCysAFPx-kPLYyQRosevtpnwoZDQqNPeYReiQG2SnW3I4TQWqjw-Pw__&crop=*&h=*&resize=*&ro=0&w=*':
      'https://us-east.stream-io-cdn.com/62344/images/69c62680-45ba-4c6c-af49-66f3acee39cf.C8B8DF8D-A326-44A6-8030-C2B1C61116A5.jpg',
  };

  it('should return a url without params', () => {
    const urls = Object.keys(testUrlMap);

    urls.forEach((url) => {
      expect(getUrlWithoutParams(url)).toBe(testUrlMap[url]);
    });
  });
});

describe('formatMsToMinSec', () => {
  it('should format values below 1 minute as seconds', () => {
    expect(formatMsToMinSec(0)).toBe('0s');
    expect(formatMsToMinSec(999)).toBe('0s');
    expect(formatMsToMinSec(59_999)).toBe('59s');
  });

  it('should format values from 1 minute to below 1 hour as minutes', () => {
    expect(formatMsToMinSec(60_000)).toBe('1m');
    expect(formatMsToMinSec(61_000)).toBe('1m');
    expect(formatMsToMinSec(3_599_999)).toBe('59m');
  });

  it('should format values from 1 hour and above as hours', () => {
    expect(formatMsToMinSec(3_600_000)).toBe('1h');
    expect(formatMsToMinSec(3_661_000)).toBe('1h');
    expect(formatMsToMinSec(7_200_000)).toBe('2h');
  });
});
