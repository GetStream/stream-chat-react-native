import React, { useMemo, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { ProgressControlThumb, PROGRESS_THUMB_WIDTH } from './ProgressThumb';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type ProgressControlProps = {
  /** Whether the underlying attachment is playing. */
  isPlaying: boolean;
  /** Playback progress as a fraction from 0 to 1. */
  progress: number;
  /** Test ID of the pan gesture. */
  testID: string;
  /** Called with the progress when a drag ends. The control is only seekable when this is set. */
  onEndDrag?: (progress: number) => void;
  /** Called with the progress when a drag starts. */
  onStartDrag?: (progress: number) => void;
  /** Expands the touch area vertically by 12px on each side of the 3px track. */
  expandedTouchArea?: boolean;
};

const TRACK_HEIGHT = 3;

const EXPANDED_TOUCH_SLOP = 12;

export const ProgressControl = (props: ProgressControlProps) => {
  const { expandedTouchArea, isPlaying, onEndDrag, onStartDrag, progress, testID } = props;
  const styles = useStyles();
  const [widthInNumbers, setWidthInNumbers] = useState<number>(0);
  const isRTL = I18nManager.isRTL;
  const thumbDirectionMultiplier = isRTL ? -1 : 1;

  const state = useSharedValue(progress);
  const isSeekable = onEndDrag !== undefined;

  const {
    theme: {
      progressControl: { container, filledStyles, thumb },
    },
  } = useTheme();

  useAnimatedReaction(
    () => progress,
    (newProgress) => {
      state.value = newProgress;
    },
    [progress],
  );

  const pan = useMemo(() => {
    const gesture = Gesture.Pan()
      .enabled(isSeekable)
      .maxPointers(1)
      .onStart(() => {
        if (onStartDrag) {
          runOnJS(onStartDrag)(state.value);
        }
      })
      .onUpdate((event) => {
        const nextProgress = isRTL ? 1 - event.x / widthInNumbers : event.x / widthInNumbers;
        state.value = Math.max(0, Math.min(nextProgress, 1));
      })
      .onEnd(() => {
        if (onEndDrag) {
          runOnJS(onEndDrag)(state.value);
        }
      })
      .withTestId(testID);

    if (expandedTouchArea) {
      gesture.hitSlop({ bottom: EXPANDED_TOUCH_SLOP, top: EXPANDED_TOUCH_SLOP });
    }

    return gesture;
  }, [expandedTouchArea, isRTL, isSeekable, onEndDrag, onStartDrag, state, testID, widthInNumbers]);

  const thumbStyles = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: interpolate(
            state.value,
            [0, 1],
            [0, (widthInNumbers - PROGRESS_THUMB_WIDTH / 2) * thumbDirectionMultiplier],
          ),
        },
      ],
      position: 'absolute',
    }),
    [thumbDirectionMultiplier, widthInNumbers],
  );

  const animatedFilledStyles = useAnimatedStyle(
    () => ({
      width: state.value * widthInNumbers,
    }),
    [widthInNumbers],
  );

  const progressPercent = Math.round(progress * 100);
  const accessibilityValue = useMemo(
    () => ({ max: 100, min: 0, now: progressPercent }),
    [progressPercent],
  );

  return (
    <GestureDetector gesture={pan}>
      <View
        accessibilityRole={onEndDrag ? 'adjustable' : 'progressbar'}
        accessibilityValue={accessibilityValue}
        onLayout={({ nativeEvent }) => {
          setWidthInNumbers(nativeEvent.layout.width);
        }}
        style={[styles.container, container]}
      >
        <Animated.View style={[styles.filledStyle, animatedFilledStyles, filledStyles]} />
        <Animated.View style={[thumbStyles, thumb]}>
          {onEndDrag ? <ProgressControlThumb isPlaying={isPlaying} /> : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        borderRadius: primitives.radiusMax,
        height: TRACK_HEIGHT,
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: semantics.chatWaveformBar,
      },
      filledStyle: {
        alignSelf: 'center',
        borderRadius: primitives.radiusMax,
        height: TRACK_HEIGHT,
        backgroundColor: semantics.chatWaveformBarPlaying,
      },
    });
  }, [semantics.chatWaveformBar, semantics.chatWaveformBarPlaying]);
};

ProgressControl.displayName = 'ProgressControl';
