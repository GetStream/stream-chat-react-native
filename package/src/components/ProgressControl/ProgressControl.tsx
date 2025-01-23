import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ProgressControlProps = {
  duration: number;
  filledColor: string;
  progress: number;
  testID: string;
  width: number | string;
  onPlayPause?: (status?: boolean) => void;
  onProgressDrag?: (progress: number) => void;
};

const height = 3;

const ProgressControlThumb = () => {
  const {
    theme: {
      colors: { black, grey_dark, static_white },
    },
  } = useTheme();
  return (
    <View
      style={[
        styles.progressControlThumbStyle,
        { backgroundColor: static_white, borderColor: grey_dark, shadowColor: black },
      ]}
    />
  );
};

export const ProgressControl = React.memo(
  (props: ProgressControlProps) => {
    const {
      duration,
      filledColor: filledColorFromProp,
      onPlayPause,
      onProgressDrag,
      progress,
      testID,
      width,
    } = props;
    const state = useSharedValue(0);
    const translateX = useSharedValue(0);
    const { width: windowWidth } = Dimensions.get('screen');
    const widthInNumbers = width
      ? typeof width === 'string'
        ? (windowWidth * Number(width?.substring(0, width.length - 1))) / 100
        : width
      : 0;
    const {
      theme: {
        colors: { grey_dark },
        progressControl: { container, filledColor: filledColorFromTheme, filledStyles, thumb },
      },
    } = useTheme();

    const pan = Gesture.Pan()
      .maxPointers(1)
      .onStart(() => {
        if (onPlayPause) runOnJS(onPlayPause)(true);
        cancelAnimation(translateX);
        state.value = translateX.value;
      })
      .onChange((event) => {
        state.value = translateX.value + event.translationX;
        if (state.value > widthInNumbers) state.value = widthInNumbers;
        else if (state.value < 0) state.value = 0;
      })
      .onEnd(() => {
        translateX.value = state.value;
        const dragFinishLocationInSeconds = (state.value / widthInNumbers) * duration;
        if (onProgressDrag) runOnJS(onProgressDrag)(dragFinishLocationInSeconds);
        if (onPlayPause) runOnJS(onPlayPause)(false);
      })
      .withTestId(testID);

    const filledColor = filledColorFromProp || filledColorFromTheme;

    useEffect(() => {
      if (progress <= 1) {
        state.value = progress * widthInNumbers;
        translateX.value = progress * widthInNumbers;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress, widthInNumbers]);

    const animatedStyles = useAnimatedStyle(() => ({
      backgroundColor: filledColor,
      width: state.value,
    }));

    const thumbStyles = useAnimatedStyle(() => ({
      transform: [{ translateX: state.value }],
    }));

    return (
      <View
        style={[styles.container, { backgroundColor: grey_dark, width: widthInNumbers }, container]}
      >
        <Animated.View style={[styles.filledStyle, animatedStyles, filledStyles]} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[thumbStyles, thumb]}>
            {onProgressDrag ? <ProgressControlThumb /> : null}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.duration !== nextProps.duration) return false;
    if (prevProps.progress !== nextProps.progress) return false;
    if (prevProps.width !== nextProps.width) return false;
    else return true;
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    height,
  },
  filledStyle: {
    height,
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
    width: 6,
  },
});
ProgressControl.displayName = 'ProgressControl';
