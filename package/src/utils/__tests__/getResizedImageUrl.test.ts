import { PixelRatio } from 'react-native';

import { getResizedImageUrl, GetResizedImageUrlParams } from '../getResizedImageUrl';
import { StreamChatRN } from '../StreamChatRN';

const TEST_URL_1 =
  'http://us-east.stream-io-cdn.com/blah?sig=34k23n4k23nk423&oh=300&ow=200&h=*&w=*&resize=*';
const TEST_URL_2 = 'http://us-east.stream-io-cdn.com/blah?oh=300&ow=200&h=*&w=*&resize=*';
const TEST_CASES: GetResizedImageUrlParams[] = [
  { height: 100, resize: 'scale', url: TEST_URL_1, width: 100 },
  { height: 200, resize: 'fill', url: TEST_URL_1, width: 300 },
  { height: 1000, resize: 'clip', url: TEST_URL_1, width: 10 },
  { height: 100, resize: 'scale', url: TEST_URL_2, width: 100 },
  { height: 200, resize: 'fill', url: TEST_URL_2, width: 300 },
  { height: 1000, resize: 'clip', url: TEST_URL_2, width: 10 },
];
describe('getResizedImageUrl (happy flow)', () => {
  it.each(TEST_CASES)(
    'should append given height, width and resize mode to all url sorts',
    ({ height, resize, url, width }) => {
      const resizedUrl = getResizedImageUrl({ height, resize, url, width });
      const parsedUrl = new URL(resizedUrl);
      expect(parsedUrl.searchParams.get('h')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(height as number)}`,
      );
      expect(parsedUrl.searchParams.get('w')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(width as number)}`,
      );
      expect(parsedUrl.searchParams.get('resize')).toEqual(resize);
    },
  );

  it('should append all related params with resizableCDNHosts was set', () => {
    StreamChatRN.setConfig({ resizableCDNHosts: ['my-company-cdn.com'] });
    const resizedUrl = getResizedImageUrl({
      height: 100,
      url: 'http://my-company-cdn.com/cat-photo?sig=34k23n4k23nk423&oh=300&ow=200',
      width: 100,
    });
    expect(resizedUrl).toEqual(
      'http://my-company-cdn.com/cat-photo?sig=34k23n4k23nk423&oh=300&ow=200&h=200&w=200&resize=clip',
    );
  });
});

describe('getResizedImageUrl (sad flow)', () => {
  afterEach(jest.restoreAllMocks);

  it.each([
    { height: 100, url: 'http://foo.com/blah_(wikipedia)#cite-1', width: 100 },
    { url: 'http://us-east.stream-io-cdn.com/blah?oh=300' },
    { url: 'http://us-east.stream-io-cdn.com/blah?ow=300' },
  ])('should append given height, width and resize mode to url', ({ height, url, width }) => {
    const resizedUrl = getResizedImageUrl({
      height,
      url,
      width,
    });
    expect(resizedUrl).toEqual(url);
  });

  it('handles an error correctly and log warns it', () => {
    let someError;
    jest.spyOn(console, 'warn');
    jest.spyOn(global, 'URL').mockImplementationOnce(() => ({
      // @ts-ignore
      searchParams: {
        get: () => {
          throw (someError = new Error('some error'));
        },
      },
    }));
    const resizedUrl = getResizedImageUrl({
      url: TEST_URL_1,
    });
    expect(console.warn).toHaveBeenCalledWith(someError);
    expect(resizedUrl).toEqual(TEST_URL_1);
  });
});
