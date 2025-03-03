import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { resampleWaveformData } from '../MessageInput/utils/audioSampling';

export type WaveProgressBarProps = {
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
   * The color of the filled waveform
   */
  filledColor?: string;
  /**
   * The function to be called when the user ends dragging the waveform
   */
  onEndDrag?: (progress: number) => void;
  /**
   * The function to be called when the user plays or pauses the audio
   * @deprecated Use onStartDrag and onEndDrag instead
   */
  onPlayPause?: (status?: boolean) => void;
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
const WAVE_MAX_HEIGHT = 25;
const WAVE_MIN_HEIGHT = 3;

const ProgressControlThumb = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const {
    theme: {
      colors: { black, grey_dark, static_white },
    },
  } = useTheme();
  return (
    <View
      hitSlop={{ bottom: 20, left: 20, right: 20, top: 20 }}
      style={[
        styles.progressControlThumbStyle,
        {
          backgroundColor: static_white,
          borderColor: grey_dark,
          shadowColor: black,
        },
        style,
      ]}
    />
  );
};

export const WaveProgressBar = React.memo(
  (props: WaveProgressBarProps) => {
    /* On Android, the seek doesn't work for AAC files, hence we disable progress drag for now */
    const showProgressDrag = Platform.OS === 'ios';
    const {
      amplitudesCount = 70,
      filledColor,
      onEndDrag,
      onPlayPause,
      onProgressDrag,
      onStartDrag,
      progress,
      waveformData,
    } = props;
    const eachWaveformWidth = WAVEFORM_WIDTH * 2;
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

    useEffect(() => {
      waveFormNumberFromProgress(progress);
    }, [progress, waveFormNumberFromProgress]);

    const {
      theme: {
        colors: { accent_blue, grey_dark },
        waveProgressBar: { container, thumb, waveform: waveformTheme },
      },
    } = useTheme();

    const pan = Gesture.Pan()
      .maxPointers(1)
      .onStart((event) => {
        const currentProgress = (state.value + event.x) / fullWidth;
        state.value = Math.max(0, Math.min(currentProgress, 1));
        if (onStartDrag) {
          runOnJS(onStartDrag)(state.value);
        }
        if (onPlayPause) {
          runOnJS(onPlayPause)(true);
        }
      })
      .onUpdate((event) => {
        const currentProgress = (state.value + event.x) / fullWidth;
        state.value = Math.max(0, Math.min(currentProgress, 1));
        if (onProgressDrag) {
          runOnJS(onProgressDrag)(state.value);
        }
      })
      .onEnd((event) => {
        const currentProgress = (state.value + event.x) / fullWidth;
        state.value = Math.max(0, Math.min(currentProgress, 1));
        if (onEndDrag) {
          runOnJS(onEndDrag)(state.value);
        }
        if (onPlayPause) {
          runOnJS(onPlayPause)(false);
        }
      });

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
        <View style={[styles.container, container]}>
          {resampledWaveformData.map((waveform, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveform,
                {
                  backgroundColor:
                    index < currentWaveformProgress ? filledColor || accent_blue : grey_dark,
                  height:
                    waveform * WAVE_MAX_HEIGHT > WAVE_MIN_HEIGHT
                      ? waveform * WAVE_MAX_HEIGHT
                      : WAVE_MIN_HEIGHT,
                },
                waveformTheme,
              ]}
            />
          ))}
          {showProgressDrag && (onEndDrag || onProgressDrag) && (
            <Animated.View style={[thumbStyles, thumb]}>
              <ProgressControlThumb />
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
  },
  progressControlThumbStyle: {
    borderRadius: 5,
    borderWidth: 0.2,
    elevation: 6,
    height: 28,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    width: WAVEFORM_WIDTH * 2,
  },
  waveform: {
    alignSelf: 'center',
    borderRadius: 2,
    marginRight: WAVEFORM_WIDTH,
    width: WAVEFORM_WIDTH,
  },
});

WaveProgressBar.displayName = 'WaveProgressBar';
