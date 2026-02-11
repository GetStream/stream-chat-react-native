import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  /**
   * If true, the underlying attachment is playing.
   */
  isPlaying: boolean;
  /**
   * The progress of the progress bar in percentage
   */
  progress: number;
  /**
   * The test ID of the progress control
   */
  testID: string;
  /**
   * The function to be called when the user ends dragging the progress bar
   */
  onEndDrag?: (progress: number) => void;
  /**
   * The function to be called when the user starts dragging the progress bar
   */
  onStartDrag?: (progress: number) => void;
  /**
   * The width of the progress control
   */
  width?: number;
};

const TRACK_HEIGHT = 3;

export const ProgressControl = (props: ProgressControlProps) => {
  const { isPlaying, onEndDrag, onStartDrag, progress, testID } = props;
  const styles = useStyles();
  const [widthInNumbers, setWidthInNumbers] = useState<number>(0);

  const state = useSharedValue(progress);
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
          const newProgress = Math.max(0, Math.min(event.x / widthInNumbers, 1));
          state.value = newProgress;
        })
        .onEnd(() => {
          if (onEndDrag) {
            runOnJS(onEndDrag)(state.value);
          }
        })
        .withTestId(testID),
    [onEndDrag, onStartDrag, state, testID, widthInNumbers],
  );

  const thumbStyles = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateX: interpolate(
            state.value,
            [0, 1],
            [0, widthInNumbers - PROGRESS_THUMB_WIDTH / 2],
          ),
        },
      ],
      position: 'absolute',
    }),
    [widthInNumbers],
  );

  const animatedFilledStyles = useAnimatedStyle(
    () => ({
      width: state.value * widthInNumbers,
    }),
    [widthInNumbers],
  );

  return (
    <GestureDetector gesture={pan}>
      <View
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
