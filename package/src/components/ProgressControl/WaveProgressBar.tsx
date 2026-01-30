import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';
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
   * The function to be called when the user is dragging the waveform
   */
  onProgressDrag?: (progress: number) => void;
  /**
   * The function to be called when the user starts dragging the waveform
   */
  onStartDrag?: (progress: number) => void;
};

const WAVEFORM_WIDTH = 2;
const WAVE_MAX_HEIGHT = 20;
const WAVE_MIN_HEIGHT = 2;

const ProgressControlThumb = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const styles = useStyles();
  return (
    <View
      hitSlop={20}
      style={[styles.progressControlThumbStyle, primitives.lightElevation4, style]}
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
      onProgressDrag,
      onStartDrag,
      progress,
      waveformData,
    } = props;
    const eachWaveformWidth = WAVEFORM_WIDTH * 2;
    const fullWidth = (amplitudesCount - 1) * eachWaveformWidth;
    const state = useSharedValue(progress);
    const [currentWaveformProgress, setCurrentWaveformProgress] = useState<number>(0);

    const styles = useStyles();

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
          .enabled(showProgressDrag)
          .maxPointers(1)
          .onStart(() => {
            if (onStartDrag) {
              runOnJS(onStartDrag)(state.value);
            }
          })
          .onUpdate((event) => {
            const newProgress = Math.max(0, Math.min(event.x / fullWidth, 1));
            state.value = newProgress;
            waveFormNumberFromProgress(newProgress);
          })
          .onEnd(() => {
            if (onEndDrag) {
              runOnJS(onEndDrag)(state.value);
            }
          }),
      [fullWidth, onEndDrag, onStartDrag, showProgressDrag, state, waveFormNumberFromProgress],
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
        <View style={[styles.container, container]}>
          {resampledWaveformData.map((waveform, index) => (
            <Animated.View
              key={index}
              style={[
                styles.waveform,
                {
                  backgroundColor:
                    index < currentWaveformProgress
                      ? filledColor || semantics.chatWaveformBarPlaying
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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
        },
        progressControlThumbStyle: {
          backgroundColor: semantics.accentPrimary,
          borderColor: semantics.borderCoreOnAccent,
          height: 12,
          width: 12,
          borderRadius: primitives.radiusMax,
          borderWidth: 2,
          elevation: 6,
          shadowOffset: {
            height: 3,
            width: 0,
          },
          shadowOpacity: 0.27,
          shadowRadius: 4.65,
        },
        waveform: {
          alignSelf: 'center',
          borderRadius: primitives.radiusXxs,
          marginRight: WAVEFORM_WIDTH,
          width: WAVEFORM_WIDTH,
        },
      }),
    [semantics],
  );
};

WaveProgressBar.displayName = 'WaveProgressBar';
