import React from 'react';

import { useDerivedValue } from 'react-native-reanimated';

import { Canvas, LinearGradient, Path, vec } from '@shopify/react-native-skia';

import { WAVE_STYLE } from './styles';
import type { VoiceVisualizationProps } from './types';
import type { VoiceVisualization } from './useVoiceVisualization';
import { type VoiceCanvasSize, VoiceVisualizationView } from './VoiceVisualizationView';
import {
  WAVE_END,
  WAVE_POSITIONS,
  WAVE_START,
  waveColors,
  wavePath,
  waveStrokeWidth,
} from './waveGeometry';

export type VoiceWaveProps = VoiceVisualizationProps;

const WaveCanvas = ({
  size: { height, pixelRatio, width },
  visualization: { dark, driver },
}: {
  size: VoiceCanvasSize;
  visualization: VoiceVisualization;
}) => {
  const path = useDerivedValue(() => wavePath(driver.value, width, height));
  const colors = useDerivedValue(() => waveColors(driver.value, dark.value));
  const m = Math.min(width, height);

  return (
    <Canvas style={{ height, width }}>
      <Path
        path={path}
        strokeCap='round'
        strokeJoin='round'
        strokeWidth={waveStrokeWidth(width, height, pixelRatio)}
        style='stroke'
      >
        <LinearGradient
          colors={colors}
          end={vec(width / 2 + WAVE_END * m, 0)}
          positions={WAVE_POSITIONS}
          start={vec(width / 2 + WAVE_START * m, 0)}
        />
      </Path>
    </Canvas>
  );
};

const renderWave = (visualization: VoiceVisualization, size: VoiceCanvasSize) => (
  <WaveCanvas size={size} visualization={visualization} />
);

/**
 * A voice agent as a single string, flat at its ends, carrying a wave packet that erupts with
 * speech while its colors flow along it. Tapping the string ripples it from the touch, and so does
 * a hovering mouse or pen.
 *
 * It has no size of its own and draws in the middle of the view it is given, about 80% as wide as
 * its shorter side, so give it a square or a wide box.
 */
export const VoiceWave = (props: VoiceWaveProps) => (
  <VoiceVisualizationView {...props} renderCanvas={renderWave} visualStyle={WAVE_STYLE} />
);
