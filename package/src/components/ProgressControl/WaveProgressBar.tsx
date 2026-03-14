import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { ProgressControlThumb } from './ProgressThumb';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
import { resampleWaveformData } from '../MessageInput/utils/audioSampling';

export type WaveProgressBarProps = {
  /**
   * If true, the underlying attachment is playing.
   */
  isPlaying?: boolean;
  /**
   * The progress of the waveform in percentage
   */
  progress: number;
  /**
   * The waveform data to be displayed
   */
  waveformData: number[];
  /**
   * The number of amplitudes to display
   */
  amplitudesCount?: number;
  /**
   * The function to be called when the user ends dragging the waveform
   */
  onEndDrag?: (progress: number) => void;
  /**
   * The function to be called when the user is dragging the waveform
   */
  onProgressDrag?: (progress: number) => void;
  /**
   * The function to be called when the user starts dragging the waveform
   */
  onStartDrag?: (progress: number) => void;
};

const WAVEFORM_WIDTH = 2;
const WAVEFORM_GAP = 2;
const WAVE_MAX_HEIGHT = 20;
const WAVE_MIN_HEIGHT = 2;

export const WaveProgressBar = React.memo(
  (props: WaveProgressBarProps) => {
    const [width, setWidth] = useState<number>(0);
    const {
      amplitudesCount = Math.max(20, Math.floor(width / (WAVEFORM_WIDTH + WAVEFORM_GAP))),
      isPlaying = false,
      onEndDrag,
      onProgressDrag,
      onStartDrag,
      progress,
      waveformData,
    } = props;
    const eachWaveformWidth = WAVEFORM_WIDTH + WAVEFORM_GAP;
    const fullWidth = (amplitudesCount - 1) * eachWaveformWidth;
    const state = useSharedValue(progress);
    const [currentWaveformProgress, setCurrentWaveformProgress] = useState<number>(0);

    const waveFormNumberFromProgress = useCallback(
      (progress: number) => {
        'worklet';
        const progressInPrecision = Number(progress.toFixed(2));
        const progressInWaveformWidth = Number((progressInPrecision * fullWidth).toFixed(0));
        const progressInWaveformNumber = Math.floor(progressInWaveformWidth / 4);
        runOnJS(setCurrentWaveformProgress)(progressInWaveformNumber);
      },
      [fullWidth],
    );

    useAnimatedReaction(
      () => progress,
      (newProgress) => {
        state.value = newProgress;
        waveFormNumberFromProgress(newProgress);
      },
      [progress],
    );

    const {
      theme: {
        semantics,
        waveProgressBar: { container, thumb, waveform: waveformTheme },
      },
    } = useTheme();

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .maxPointers(1)
          .onStart(() => {
            if (onStartDrag) {
              runOnJS(onStartDrag)(state.value);
            }
          })
          .onUpdate((event) => {
            const newProgress = Math.max(0, Math.min((state.value + event.x) / fullWidth, 1));
            state.value = newProgress;
            waveFormNumberFromProgress(newProgress);
          })
          .onEnd(() => {
            if (onEndDrag) {
              runOnJS(onEndDrag)(state.value);
            }
          }),
      [fullWidth, onEndDrag, onStartDrag, state, waveFormNumberFromProgress],
    );

    const stringifiedWaveformData = waveformData.toString();

    const resampledWaveformData = useMemo(
      () => resampleWaveformData(waveformData, amplitudesCount),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [amplitudesCount, stringifiedWaveformData],
    );

    const thumbStyles = useAnimatedStyle(
      () => ({
        position: 'absolute',
        transform: [{ translateX: currentWaveformProgress * eachWaveformWidth }],
      }),
      [currentWaveformProgress, fullWidth],
    );

    return (
      <GestureDetector gesture={pan}>
        <View
          onLayout={({ nativeEvent }) => {
            setWidth(nativeEvent.layout.width);
          }}
          style={[styles.container, container]}
        >
          {resampledWaveformData.map((waveform, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveform,
                {
                  backgroundColor:
                    index < currentWaveformProgress
                      ? semantics.chatWaveformBarPlaying
                      : semantics.chatWaveformBar,
                  height:
                    waveform * WAVE_MAX_HEIGHT > WAVE_MIN_HEIGHT
                      ? waveform * WAVE_MAX_HEIGHT
                      : WAVE_MIN_HEIGHT,
                },
                waveformTheme,
              ]}
            />
          ))}
          {(onEndDrag || onProgressDrag) && (
            <Animated.View style={[thumbStyles, thumb]}>
              <ProgressControlThumb isPlaying={isPlaying} />
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.amplitudesCount !== nextProps.amplitudesCount) {
      return false;
    }
    if (prevProps.progress !== nextProps.progress) {
      return false;
    } else {
      return true;
    }
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: WAVEFORM_GAP,
  },
  waveform: {
    alignSelf: 'center',
    borderRadius: primitives.radiusXxs,
    width: WAVEFORM_WIDTH,
  },
});

WaveProgressBar.displayName = 'WaveProgressBar';
