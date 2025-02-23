import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ProgressControlProps = {
  /**
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
  const {
    filledColor: filledColorFromProp,
    onEndDrag,
    onPlayPause,
    onProgressDrag,
    onStartDrag,
    progress,
    testID,
  } = props;

  const progressValue = useSharedValue(progress);
  const {
    theme: {
      colors: { grey_dark },
      progressControl: { container, filledColor: filledColorFromTheme, filledStyles, thumb },
    },
  } = useTheme();

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onStart((event) => {
      const currentProgress = (progressValue.value + event.x) / widthInNumbers;
      progressValue.value = Math.max(0, Math.min(currentProgress, 1));
      if (onStartDrag) {
        runOnJS(onStartDrag)(progressValue.value);
      }
      if (onPlayPause) {
        runOnJS(onPlayPause)(true);
      }
    })
    .onUpdate((event) => {
      const currentProgress = (progressValue.value + event.x) / widthInNumbers;
      progressValue.value = Math.max(0, Math.min(currentProgress, 1));
      if (onProgressDrag) {
        runOnJS(onProgressDrag)(progressValue.value);
      }
    })
    .onEnd((event) => {
      const currentProgress = (progressValue.value + event.x) / widthInNumbers;
      progressValue.value = Math.max(0, Math.min(currentProgress, 1));
      if (onEndDrag) {
        runOnJS(onEndDrag)(progressValue.value);
      }
      if (onPlayPause) {
        runOnJS(onPlayPause)(false);
      }
    })
    .withTestId(testID);

  const filledColor = filledColorFromProp || filledColorFromTheme;

  const thumbStyles = useAnimatedStyle(
    () => ({
      transform: [{ translateX: progress * widthInNumbers - THUMB_WIDTH / 2 }],
    }),
    [progress],
  );

  const animatedFilledStyles = useAnimatedStyle(
    () => ({
      width: progress * widthInNumbers,
    }),
    [progress],
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
          {onEndDrag || onProgressDrag ? <ProgressControlThumb /> : null}
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
