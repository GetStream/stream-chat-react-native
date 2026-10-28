import React from 'react';

import { useDerivedValue } from 'react-native-reanimated';

import { Canvas, Fill, Shader } from '@shopify/react-native-skia';

import { driverReact, driverScale } from './driver';
import { getGlowEffect } from './glowShader';
import { GLOW_STYLE } from './styles';
import type { VoiceVisualizationProps } from './types';
import type { VoiceVisualization } from './useVoiceVisualization';
import { type VoiceCanvasSize, VoiceVisualizationView } from './VoiceVisualizationView';

export type VoiceGlowProps = VoiceVisualizationProps;

const GlowCanvas = ({
  size: { height, width },
  visualization: { dark, driver },
}: {
  size: VoiceCanvasSize;
  visualization: VoiceVisualization;
}) => {
  const effect = getGlowEffect();
  const uniforms = useDerivedValue(() => {
    const d = driver.value;
    const color = (i: number) => [d.colors[i].hue, d.colors[i].saturation, d.colors[i].value, 0];
    return {
      bright: d.bright,
      col0: color(0),
      col1: color(1),
      col2: color(2),
      col3: color(3),
      col4: color(4),
      count: d.count,
      dark: dark.value,
      flow: d.flow,
      flowSpin: d.flowSpin,
      hover: [d.hoverX, d.hoverY],
      hoverAmt: d.hoverAmount,
      load: d.load,
      mic: d.mic,
      orbSpin: d.orbSpin,
      react: driverReact(d),
      resolution: [width, height],
      sat: d.sat,
      scale: driverScale(d),
      tap: [d.tapX, d.tapY],
      tapTime: d.tapAge,
      time: d.time,
      voice: d.voice,
    };
  });

  if (!effect) return null;

  return (
    <Canvas style={{ height, width }}>
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
};

const renderGlow = (visualization: VoiceVisualization, size: VoiceCanvasSize) => (
  <GlowCanvas size={size} visualization={visualization} />
);

/**
 * A voice agent as a soft, airy globe: color masses orbit inside it and swell with speech, and the
 * gaps between them let the background show through. Tapping the globe bounces it and ripples it
 * from the touch, and so does a hovering mouse or pen.
 *
 * It has no size of its own and draws in the middle of the view it is given, about half as wide
 * as its shorter side, so give it a square.
 */
export const VoiceGlow = (props: VoiceGlowProps) => (
  <VoiceVisualizationView {...props} renderCanvas={renderGlow} visualStyle={GLOW_STYLE} />
);
