import { getUrlWithoutParams } from '../utils';

describe('getUrlWithoutParams', () => {
  const testUrlMap = {
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
