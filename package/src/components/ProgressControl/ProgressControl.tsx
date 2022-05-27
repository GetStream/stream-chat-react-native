import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

type ProgressControlProps = {
  duration: number;
  filledColor: string;
  onPlayPause: (status?: boolean) => void;
  onProgressDrag: (progress: number) => void;
  progress: number;
  width: number;
};

const height = 2;
const styles = StyleSheet.create({
  containerStyle: {
    borderRadius: 50,
    height,
  },
  innerStyle: {
    height,
  },
  progressControlThumbStyle: {
    backgroundColor: '#fff',
    borderRadius: 5,
    elevation: 6,
    height: 20,
    shadowColor: '#000',
    shadowOffset: {
      height: 3,
      width: 0,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    top: -11,
    width: 5,
  },
});

const ProgressControlThumb = () => <View style={styles.progressControlThumbStyle} />;

export const ProgressControl: React.FC<ProgressControlProps> = React.memo(
  (props) => {
    const { duration, filledColor, onPlayPause, onProgressDrag, progress, width } = props;
    const {
      theme: {
        colors: { grey_dark },
      },
    } = useTheme();

    const state = useSharedValue(0);
    const translateX = useSharedValue(0);

    useEffect(() => {
      state.value = progress * width;
      translateX.value = progress * width;
    }, [progress]);

    const animatedStyles = useAnimatedStyle(() => ({
      backgroundColor: filledColor,
      width: state.value,
    }));

    const thumbStyles = useAnimatedStyle(() => ({
      transform: [{ translateX: state.value }],
    }));

    const onGestureEvent = useAnimatedGestureHandler(
      {
        onActive: (event) => {
          state.value = translateX.value + event.translationX;
          if (state.value > width) state.value = width;
          else if (state.value < 0) state.value = 0;
        },
        onFinish: () => {
          translateX.value = state.value;
          const dragFinishLocationInSeconds = (state.value / width) * duration;
          runOnJS(onProgressDrag)(dragFinishLocationInSeconds);
          runOnJS(onPlayPause)(false);
        },
        onStart: () => {
          runOnJS(onPlayPause)(true);
          cancelAnimation(translateX);
          state.value = translateX.value;
        },
      },
      [duration],
    );
    return (
      <View style={[styles.containerStyle, { backgroundColor: grey_dark, width }]}>
        <Animated.View style={[styles.innerStyle, animatedStyles]} />

        <PanGestureHandler maxPointers={1} onGestureEvent={onGestureEvent}>
          <Animated.View style={[thumbStyles]}>
            <ProgressControlThumb />
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.duration === nextProps.duration && prevProps.progress === nextProps.progress)
      return true;
    else return false;
  },
);
