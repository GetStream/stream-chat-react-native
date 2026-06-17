import React, { useCallback, useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useImageGalleryContext } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { useStateStore } from '../../../hooks';
import { ImageGalleryState } from '../../../state-store/image-gallery-state-store';

const a11ySelector = (state: ImageGalleryState) => ({
  assets: state.assets,
  currentIndex: state.currentIndex,
});

type Props = {
  containerBackground: AnimatedStyle<ViewStyle>;
};

/**
 * Accessibility-enabled variant of the gallery's background fade view. Wires
 * the "X of N" announcement and the VoiceOver/TalkBack increment/decrement
 * actions. Subscribes locally to currentIndex + assets so the parent
 * ImageGallery doesn't need that subscription itself — only this small sibling
 * re-renders to refresh the accessibilityValue text on each swipe.
 *
 * Caller is responsible for gating this on whether accessibility is enabled.
 * When disabled, the parent renders a plain Animated.View with the same
 * background style and no a11y attributes.
 */
export const ImageGalleryA11yProbe = ({ containerBackground }: Props) => {
  const { imageGalleryStateStore } = useImageGalleryContext();
  const { assets, currentIndex } = useStateStore(imageGalleryStateStore.state, a11ySelector);
  const assetsCount = assets.length;

  const accessibilityValueParams = useMemo(
    () => ({ count: assetsCount, position: currentIndex + 1 }),
    [currentIndex, assetsCount],
  );
  const accessibilityValueText = useA11yLabel(
    'a11y/{{position}} of {{count}}',
    accessibilityValueParams,
  );
  const accessibilityValue = useMemo(
    () => (accessibilityValueText ? { text: accessibilityValueText } : undefined),
    [accessibilityValueText],
  );
  const adjustableActions = useMemo(
    () => [{ name: 'increment' as const }, { name: 'decrement' as const }],
    [],
  );

  const onAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      const latest = imageGalleryStateStore.state.getLatestValue();
      const latestCount = latest.assets.length;
      const latestIndex = latest.currentIndex;
      if (latestCount <= 1) return;
      if (event.nativeEvent.actionName === 'increment') {
        if (latestIndex < latestCount - 1) {
          imageGalleryStateStore.currentIndex = latestIndex + 1;
        }
      } else if (event.nativeEvent.actionName === 'decrement') {
        if (latestIndex > 0) {
          imageGalleryStateStore.currentIndex = latestIndex - 1;
        }
      }
    },
    [imageGalleryStateStore],
  );

  return (
    <Animated.View
      accessible
      accessibilityActions={adjustableActions}
      accessibilityLabel='Image Gallery'
      accessibilityRole='adjustable'
      accessibilityValue={accessibilityValue}
      onAccessibilityAction={onAccessibilityAction}
      style={[StyleSheet.absoluteFill, containerBackground]}
    />
  );
};
