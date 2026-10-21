import React, { PropsWithChildren } from 'react';

import { renderHook } from '@testing-library/react-native';

import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../../contexts/imageGalleryContext/ImageGalleryContext';
import { ImageGalleryStateStore } from '../../../../state-store/image-gallery-state-store';
import { useImageGalleryGestures } from '../useImageGalleryGestures';

const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 800;

type TapHandlers = {
  onEnd: (event: { absoluteX: number; absoluteY: number }) => void;
  onStart: (event: { absoluteX: number; absoluteY: number }) => void;
};

const setup = () => {
  const store = new ImageGalleryStateStore();
  const wrapper = ({ children }: PropsWithChildren) => (
    <ImageGalleryContext.Provider
      value={{ imageGalleryStateStore: store } as unknown as ImageGalleryContextValue}
    >
      {children}
    </ImageGalleryContext.Provider>
  );
  const values = {
    currentImageHeight: { value: 200 },
    headerFooterVisible: { value: 1 },
    offsetScale: { value: 1 },
    overlayOpacity: { value: 1 },
    scale: { value: 1 },
    translateX: { value: 0 },
    translateY: { value: 0 },
    translationX: { value: 0 },
  };

  const { result } = renderHook(
    () =>
      useImageGalleryGestures({
        ...(values as unknown as Parameters<typeof useImageGalleryGestures>[0]),
        halfScreenHeight: SCREEN_HEIGHT / 2,
        halfScreenWidth: SCREEN_WIDTH / 2,
        screenHeight: SCREEN_HEIGHT,
        screenWidth: SCREEN_WIDTH,
      }),
    { wrapper },
  );

  const doubleTap = (result.current.doubleTap as unknown as { handlers: TapHandlers }).handlers;

  return { doubleTap, values };
};

describe('useImageGalleryGestures', () => {
  // The image is translated in screen space before it is scaled around its center, so a point at
  // `d` from the center ends up at `translateX + scale * d`.
  it.each([[300], [100]])(
    'keeps the double tapped point at x=%p under the finger when zooming in',
    (tapX) => {
      const { doubleTap, values } = setup();
      const event = { absoluteX: tapX, absoluteY: SCREEN_HEIGHT / 2 };

      doubleTap.onStart(event);
      doubleTap.onEnd(event);

      const distanceFromCenter = tapX - SCREEN_WIDTH / 2;
      expect(values.scale.value).toBe(2);
      expect(values.translateX.value + values.scale.value * distanceFromCenter).toBe(
        distanceFromCenter,
      );
    },
  );

  it('zooms back out on the next double tap', () => {
    const { doubleTap, values } = setup();
    const event = { absoluteX: 300, absoluteY: SCREEN_HEIGHT / 2 };

    doubleTap.onStart(event);
    doubleTap.onEnd(event);
    doubleTap.onStart(event);
    doubleTap.onEnd(event);

    expect(values.scale.value).toBe(1);
    expect(values.translateX.value).toBe(0);
    expect(values.translateY.value).toBe(0);
  });
});
