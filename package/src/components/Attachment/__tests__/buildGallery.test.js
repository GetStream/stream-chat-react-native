import { PixelRatio } from 'react-native';

import { generateImageAttachment } from '../../../mock-builders/generator/attachment';
import { buildGallery } from '../utils/buildGallery';

describe('buildGallery', () => {
  const defaultSizeConfig = {
    gridHeight: 100,
    gridWidth: 200,
    maxHeight: 300,
    maxWidth: 350,
    minHeight: 10,
    minWidth: 20,
  };

  it('gallery size should not exceed max sizes provided by size config', () => {
    const imageSizeTestCases = [
      { height: 1000, width: 2000 },
      { height: 100, width: 200 },
      { height: 10, width: 20 },
      { height: 200, width: 300 },
    ];

    imageSizeTestCases.forEach((size) => {
      const a1 = generateImageAttachment({
        ...size,
      });

      const { height, thumbnailGrid, width } = buildGallery({
        images: [a1],
        sizeConfig: defaultSizeConfig,
      });

      expect(height).toBeLessThanOrEqual(defaultSizeConfig.maxHeight);
      expect(height).toBeGreaterThanOrEqual(defaultSizeConfig.minHeight);

      expect(width).toBeLessThanOrEqual(defaultSizeConfig.maxWidth);
      expect(width).toBeGreaterThanOrEqual(defaultSizeConfig.minWidth);

      expect(thumbnailGrid[0][0].height).toBeLessThanOrEqual(height);
      expect(thumbnailGrid[0][0].width).toBeLessThanOrEqual(width);
    });
  });

  it('aspect ratio of gallery container should be same as that of original image', () => {
    const sizeConfig = {
      ...defaultSizeConfig,
      maxHeight: 10000,
      maxWidth: 10000,
      minHeight: 0,
      minWidth: 0,
    };

    const imageSizeTestCases = [
      { height: 1000, width: 2000 },
      { height: 100, width: 200 },
      { height: 10, width: 20 },
      { height: 200, width: 300 },
    ];

    imageSizeTestCases.forEach((size) => {
      const a1 = generateImageAttachment({
        ...size,
      });

      const { height, width } = buildGallery({
        images: [a1],
        sizeConfig,
      });

      const originalAspectRatio = size.width / size.height;
      const resultingAspectRatio = width / height;
      expect(originalAspectRatio).toBe(resultingAspectRatio);
    });
  });

  it('gallery size should default to gridHeight and gridWidth if original image size is unavailable', () => {
    const a1 = generateImageAttachment();

    const { height, width } = buildGallery({
      images: [a1],
      sizeConfig: defaultSizeConfig,
    });

    expect(height).toBe(defaultSizeConfig.gridHeight);
    expect(width).toBe(defaultSizeConfig.gridWidth);
  });

  it('thumbnail size should be smaller than the limits set by sizeConfig', () => {
    const bigImage = generateImageAttachment({
      height: 1200,
      image_url:
        'https://stream-io.cdn.com/23kn4k2j3n4k2n3k4n23?sig=34k23n4k23nk423&h=*&w=*&resize=*',
      width: 900,
    });

    const { thumbnailGrid: tg1 } = buildGallery({
      images: [bigImage],
      sizeConfig: defaultSizeConfig,
    });
    const t1 = tg1[0][0];
    expect(t1.url.includes(`h=${PixelRatio.getPixelSizeForLayoutSize(t1.height)}`)).toBe(true);
    expect(t1.url.includes(`&w=${PixelRatio.getPixelSizeForLayoutSize(t1.width)}`)).toBe(true);
    expect(t1.url.includes(`&resize=clip`)).toBe(true);

    const smallImage = generateImageAttachment({
      height: 30,
      image_url:
        'https://stream-io.cdn.com/23kn4k2j3n4k2n3k4n23?sig=34k23n4k23nk423&h=*&w=*&resize=*',
      width: 20,
    });

    const { thumbnailGrid: tg2 } = buildGallery({
      images: [smallImage],
      sizeConfig: defaultSizeConfig,
    });

    const t2 = tg2[0][0];
    expect(t2.url.includes(`h=*`)).toBe(true);
    expect(t2.url.includes(`&w=*`)).toBe(true);
    expect(t2.url.includes(`&resize=*`)).toBe(true);
  });
});
