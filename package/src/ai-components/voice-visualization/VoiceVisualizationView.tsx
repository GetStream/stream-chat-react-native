import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PixelRatio,
  type PointerEvent,
  StyleSheet,
  View,
} from 'react-native';

import Animated from 'react-native-reanimated';

import type { VoiceVisualizationStyle } from './styles';
import type { VoiceAgentState, VoiceVisualizationProps } from './types';
import { useVoiceVisualization, type VoiceVisualization } from './useVoiceVisualization';

/** What the renderer draws in: the canvas size, in its own units, and the screen's pixels per unit. */
export type VoiceCanvasSize = { height: number; pixelRatio: number; width: number };

type ViewProps = VoiceVisualizationProps & {
  /** Draws the visualization into a canvas of the given size. */
  renderCanvas: (visualization: VoiceVisualization, size: VoiceCanvasSize) => ReactNode;
  visualStyle: VoiceVisualizationStyle;
};

const STATE_DESCRIPTIONS: Record<VoiceAgentState, string> = {
  connecting: 'Connecting',
  idle: 'Ready',
  listening: 'Listening',
  speaking: 'Speaking',
  thinking: 'Thinking',
};

/**
 * What VoiceWave and VoiceGlow share: the motion, the canvas kept at the view's size and at most
 * the style's density, reduced motion, taps and hover, and accessibility.
 *
 * It names itself "Voice agent" with its state as the value, as on iOS and Android. Touches are
 * only watched, never claimed, so a press handler on the view or a parent still gets them, and
 * only the shape takes them: around it they reach whatever is behind.
 */
export const VoiceVisualizationView = ({
  accessibilityLabel = 'Voice agent',
  accessibilityValue,
  audioLevel,
  colors,
  expressivity,
  onLayout,
  pointerEvents = 'box-none',
  renderCanvas,
  state,
  style,
  visualStyle,
  ...restProps
}: ViewProps) => {
  const visualization = useVoiceVisualization(
    { audioLevel, colors, expressivity, state },
    visualStyle,
  );
  const { hover, opacity, tap } = visualization;
  const [layout, setLayout] = useState({ height: 0, width: 0 });

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      const { height, width } = event.nativeEvent.layout;
      setLayout((current) =>
        current.width === width && current.height === height ? current : { height, width },
      );
    },
    [onLayout],
  );

  const side = Math.min(layout.width, layout.height);
  const pixelRatio = PixelRatio.get();
  // Drawn at no more than the style's density, then scaled up to the view: the glow's soft
  // gradients look the same at 2x with fewer pixels to fill, while the wave's line needs 3x.
  const density = Math.min(1, visualStyle.maxScale / pixelRatio);
  const canvasSize = useMemo<VoiceCanvasSize>(
    () => ({
      height: layout.height * density,
      pixelRatio: pixelRatio * density,
      width: layout.width * density,
    }),
    [density, layout.height, layout.width, pixelRatio],
  );
  const hitWidth = visualStyle.hitArea.width * side;
  const hitHeight = visualStyle.hitArea.height * side;

  /** A touch on the hit area, centred on the view and normalized to its shorter side, y up. */
  const toLocalPoint = useCallback(
    (locationX: number, locationY: number) => ({
      x: (locationX - hitWidth / 2) / (side || 1),
      y: (hitHeight / 2 - locationY) / (side || 1),
    }),
    [hitHeight, hitWidth, side],
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const { x, y } = toLocalPoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
      if (visualStyle.contains(x, y)) tap(x, y);
    },
    [tap, toLocalPoint, visualStyle],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      // Only a hovering mouse or pen ripples it; a finger has no hover.
      const { buttons, offsetX, offsetY, pointerType } = event.nativeEvent;
      if (pointerType === 'touch') return;
      const { x, y } = toLocalPoint(offsetX, offsetY);
      const hovering = buttons === 0 && visualStyle.contains(x, y);
      hover(hovering ? x : null, hovering ? y : null);
    },
    [hover, toLocalPoint, visualStyle],
  );

  const handlePointerLeave = useCallback(() => hover(null, null), [hover]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='image'
      accessibilityValue={accessibilityValue ?? { text: STATE_DESCRIPTIONS[state] }}
      accessible
      onLayout={handleLayout}
      pointerEvents={pointerEvents}
      style={style}
      {...restProps}
    >
      {side > 0 ? (
        <>
          <Animated.View
            pointerEvents='none'
            style={[
              styles.canvas,
              {
                height: canvasSize.height,
                left: (layout.width - canvasSize.width) / 2,
                opacity,
                top: (layout.height - canvasSize.height) / 2,
                transform: [{ scale: 1 / density }],
                width: canvasSize.width,
              },
            ]}
          >
            {renderCanvas(visualization, canvasSize)}
          </Animated.View>
          <View
            onPointerLeave={handlePointerLeave}
            onPointerMove={handlePointerMove}
            onTouchEnd={handleTouchEnd}
            style={[
              styles.hitArea,
              {
                height: hitHeight,
                left: (layout.width - hitWidth) / 2,
                top: (layout.height - hitHeight) / 2,
                width: hitWidth,
              },
            ]}
            testID='voice-visualization-hit-area'
          />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: { position: 'absolute' },
  hitArea: { position: 'absolute' },
});
