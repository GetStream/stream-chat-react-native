import { useCallback, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';

/**
 * Width of the view this is attached to, rather than of the window.
 *
 * A library component can be rendered in a container narrower than the window, and from iOS 27 the
 * window itself is resizable. The window width is only the first-paint estimate, before `onLayout`
 * has reported.
 *
 * @example
 * const { onLayout, width } = useContainerWidth();
 * return <View onLayout={onLayout}>{...}</View>;
 */
export const useContainerWidth = () => {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(undefined);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setMeasuredWidth((previousWidth) => (previousWidth === nextWidth ? previousWidth : nextWidth));
  }, []);

  return { onLayout, width: measuredWidth ?? windowWidth };
};
