import { PixelRatio } from 'react-native';

import { getResizedImageUrl } from '../getResizedImageUrl';

describe('getResizedImageUrl', () => {
  it('should return same url if its not cloudfront cdn', () => {
    const testUrl = 'http://foo.com/blah_(wikipedia)#cite-1';

    const resizedUrl = getResizedImageUrl({ height: 100, url: testUrl, width: 100 });
    expect(resizedUrl).toEqual(testUrl);
  });

  it('should append given height, width and resize mode to url', () => {
    const testUrl = 'http://us-east.stream-io-cdn.com/blah';

    const testConfigs = [
      { height: 100, resize: 'scale', width: 100 },
      { height: 200, resize: 'fill', width: 300 },
      { height: 1000, resize: 'clip', width: 10 },
    ];

    testConfigs.forEach(({ height, resize, width }) => {
      const resizedUrl = getResizedImageUrl({ height, resize, url: testUrl, width });
      const parsedUrl = new URL(resizedUrl);
      expect(parsedUrl.searchParams.get('h')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(height)}`,
      );
      expect(parsedUrl.searchParams.get('w')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(width)}`,
      );
      expect(parsedUrl.searchParams.get('resize')).toEqual(resize);
    });
  });

  it('should replace wildcards with given height, width and resize mode within url', () => {
    const testUrl = 'http://us-east.stream-io-cdn.com/blah?h=*&w=*&resize=*';

    const testConfigs = [
      { height: 100, resize: 'scale', width: 100 },
      { height: 200, resize: 'fill', width: 300 },
      { height: 1000, resize: 'clip', width: 10 },
    ];

    testConfigs.forEach(({ height, resize, width }) => {
      const resizedUrl = getResizedImageUrl({ height, resize, url: testUrl, width });
      const parsedUrl = new URL(resizedUrl);
      expect(parsedUrl.searchParams.get('h')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(height)}`,
      );
      expect(parsedUrl.searchParams.get('w')).toEqual(
        `${PixelRatio.getPixelSizeForLayoutSize(width)}`,
      );
      expect(parsedUrl.searchParams.get('resize')).toEqual(resize);
    });
  });
});
