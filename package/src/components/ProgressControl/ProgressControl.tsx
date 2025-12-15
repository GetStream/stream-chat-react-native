import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ProgressControlProps = {
  /**
   * @deprecated unused prop.
   * The duration of the audio in seconds
   */
  duration: number;
  /**
   * The color of the filled progress bar
   */
  filledColor: string;
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
   * The function to be called when the user plays or pauses the audio
   * @deprecated Use onStartDrag and onEndDrag instead
   */
  onPlayPause?: (status?: boolean) => void;
  /**
   * The function to be called when the user is dragging the progress bar
   * @deprecated This is not used anymore and is handled locally
   */
  onProgressDrag?: (progress: number) => void;
  /**
   * The function to be called when the user starts dragging the progress bar
   */
  onStartDrag?: (progress: number) => void;
  /**
   * The width of the progress control
   */
  width?: number | string;
};

const TRACK_HEIGHT = 3;
const THUMB_WIDTH = 8;

const ProgressControlThumb = () => {
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
        { backgroundColor: static_white, borderColor: grey_dark, shadowColor: black },
      ]}
    />
  );
};

export const ProgressControl = (props: ProgressControlProps) => {
  const [widthInNumbers, setWidthInNumbers] = useState(0);
  const { filledColor: filledColorFromProp, onEndDrag, onStartDrag, progress, testID } = props;

  const state = useSharedValue(progress);
  const {
    theme: {
      colors: { grey_dark },
      progressControl: { container, filledColor: filledColorFromTheme, filledStyles, thumb },
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

  const filledColor = filledColorFromProp || filledColorFromTheme;

  const thumbStyles = useAnimatedStyle(
    () => ({
      transform: [{ translateX: state.value * widthInNumbers - THUMB_WIDTH / 2 }],
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
        style={[styles.container, { backgroundColor: grey_dark }, container]}
      >
        <Animated.View
          style={[
            styles.filledStyle,
            animatedFilledStyles,
            {
              backgroundColor: filledColor,
            },
            filledStyles,
          ]}
        />
        <Animated.View style={[thumbStyles, thumb]}>
          {onEndDrag ? <ProgressControlThumb /> : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    height: TRACK_HEIGHT,
  },
  filledStyle: {
    borderRadius: 2,
    height: TRACK_HEIGHT,
  },
  progressControlThumbStyle: {
    borderRadius: 5,
    borderWidth: 0.2,
    elevation: 6,
    height: 30,
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    top: -15,
    width: THUMB_WIDTH,
  },
});
ProgressControl.displayName = 'ProgressControl';
