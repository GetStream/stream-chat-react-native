import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

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

const clampProgress = (progress: number) => {
  'worklet';
  return Math.max(0, Math.min(progress, 1));
};

type WaveformBarsProps = {
  color: string;
  heights: number[];
  waveformStyle?: StyleProp<ViewStyle>;
};

const WaveformBars = React.memo(({ color, heights, waveformStyle }: WaveformBarsProps) => (
  <View style={styles.waveformLayer}>
    {heights.map((height, index) => (
      <View
        key={index}
        style={[
          styles.waveform,
          {
            backgroundColor: color,
            height,
          },
          waveformStyle,
        ]}
      />
    ))}
  </View>
));

WaveformBars.displayName = 'WaveformBars';

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
    const [showInteractiveLayer, setShowInteractiveLayer] = useState(
      () => progress > 0 || isPlaying,
    );
    const eachWaveformWidth = WAVEFORM_WIDTH + WAVEFORM_GAP;
    const fullWidth = (amplitudesCount - 1) * eachWaveformWidth;
    const maxProgressWidth = fullWidth + WAVEFORM_WIDTH;
    const dragStartProgress = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const visualProgress = useSharedValue(progress);

    const {
      theme: {
        semantics,
        waveProgressBar: { container, thumb, waveform: waveformTheme },
      },
    } = useTheme();

    useEffect(() => {
      if (!isDragging.value) {
        visualProgress.value = progress;
      }
    }, [isDragging, progress, visualProgress]);

    useEffect(() => {
      setShowInteractiveLayer(progress > 0 || isPlaying);
    }, [isPlaying, progress]);

    const handleStartDrag = useCallback(
      (nextProgress: number) => {
        setShowInteractiveLayer(true);
        onStartDrag?.(nextProgress);
      },
      [onStartDrag],
    );

    const handleProgressDrag = useCallback(
      (nextProgress: number) => {
        onProgressDrag?.(nextProgress);
      },
      [onProgressDrag],
    );

    const handleEndDrag = useCallback(
      (nextProgress: number) => {
        onEndDrag?.(nextProgress);
      },
      [onEndDrag],
    );

    const pan = useMemo(
      () =>
        Gesture.Pan()
          .maxPointers(1)
          .onStart(() => {
            const nextProgress = clampProgress(visualProgress.value);
            dragStartProgress.value = nextProgress;
            isDragging.value = true;
            if (onStartDrag) {
              runOnJS(handleStartDrag)(nextProgress);
            }
          })
          .onUpdate((event) => {
            if (fullWidth <= 0) {
              return;
            }
            const nextProgress = clampProgress(
              dragStartProgress.value + event.translationX / fullWidth,
            );
            visualProgress.value = nextProgress;
            if (onProgressDrag) {
              runOnJS(handleProgressDrag)(nextProgress);
            }
          })
          .onEnd(() => {
            isDragging.value = false;
            if (onEndDrag) {
              runOnJS(handleEndDrag)(visualProgress.value);
            }
          }),
      [
        dragStartProgress,
        fullWidth,
        handleEndDrag,
        handleProgressDrag,
        handleStartDrag,
        isDragging,
        onEndDrag,
        onProgressDrag,
        onStartDrag,
        visualProgress,
      ],
    );

    const stringifiedWaveformData = useMemo(() => waveformData.toString(), [waveformData]);

    const resampledWaveformData = useMemo(
      () => resampleWaveformData(waveformData, amplitudesCount),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [amplitudesCount, stringifiedWaveformData],
    );

    const waveformHeights = useMemo(
      () =>
        resampledWaveformData.map((waveform) =>
          waveform * WAVE_MAX_HEIGHT > WAVE_MIN_HEIGHT
            ? waveform * WAVE_MAX_HEIGHT
            : WAVE_MIN_HEIGHT,
        ),
      [resampledWaveformData],
    );

    const progressOverlayStyles = useAnimatedStyle(
      () => ({
        width: clampProgress(visualProgress.value) * maxProgressWidth,
      }),
      [maxProgressWidth],
    );

    const thumbStyles = useAnimatedStyle(
      () => ({
        position: 'absolute',
        transform: [{ translateX: clampProgress(visualProgress.value) * fullWidth }],
      }),
      [fullWidth],
    );

    return (
      <GestureDetector gesture={pan}>
        <View
          onLayout={({ nativeEvent }) => {
            setWidth(nativeEvent.layout.width);
          }}
          style={[styles.container, container]}
        >
          <WaveformBars
            color={semantics.chatWaveformBar}
            heights={waveformHeights}
            waveformStyle={waveformTheme}
          />
          {showInteractiveLayer ? (
            <Animated.View
              pointerEvents='none'
              style={[styles.progressOverlay, progressOverlayStyles]}
            >
              <WaveformBars
                color={semantics.chatWaveformBarPlaying}
                heights={waveformHeights}
                waveformStyle={waveformTheme}
              />
            </Animated.View>
          ) : null}
          {(onEndDrag || onProgressDrag) &&
            (showInteractiveLayer ? (
              <Animated.View style={[thumbStyles, thumb]}>
                <ProgressControlThumb isPlaying={isPlaying} />
              </Animated.View>
            ) : (
              <View style={[styles.idleThumb, thumb]}>
                <ProgressControlThumb isPlaying={isPlaying} />
              </View>
            ))}
        </View>
      </GestureDetector>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.amplitudesCount !== nextProps.amplitudesCount) {
      return false;
    }
    if (prevProps.isPlaying !== nextProps.isPlaying) {
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
    position: 'relative',
  },
  idleThumb: {
    left: 0,
    position: 'absolute',
  },
  progressOverlay: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  waveformLayer: {
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
