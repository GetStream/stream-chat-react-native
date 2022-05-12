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

import type { ImageGalleryFooterVideoControlProps } from './ImageGalleryFooter';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

type ProgressControlProps = Pick<
  ImageGalleryFooterVideoControlProps,
  'duration' | 'onPlayPause' | 'onProgressDrag' | 'progress'
>;

const width = 180;
const height = 2;
const styles = StyleSheet.create({
  containerStyle: {
    borderRadius: 50,
    height,
    width,
  },
  innerStyle: {
    height,
  },
  progressControlThumbStyle: {
    backgroundColor: '#fff',
    borderRadius: 5,
    height: 20,
    top: -11,
    width: 4,
  },
});

const ProgressControlThumb = () => <View style={styles.progressControlThumbStyle} />;

export const ProgressControl: React.FC<ProgressControlProps> = React.memo(
  (props) => {
    const { duration, onPlayPause, onProgressDrag, progress } = props;
    const {
      theme: {
        colors: { grey_dark, white_snow },
      },
    } = useTheme();

    const state = useSharedValue(0);
    const translateX = useSharedValue(0);

    useEffect(() => {
      state.value = progress * width;
      translateX.value = progress * width;
    }, [progress]);

    const animatedStyles = useAnimatedStyle(() => ({
      backgroundColor: white_snow,
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
          runOnJS(onPlayPause)();
        },
        onStart: () => {
          runOnJS(onPlayPause)();
          cancelAnimation(translateX);
          state.value = translateX.value;
        },
      },
      [duration],
    );
    return (
      <View style={[styles.containerStyle, { backgroundColor: grey_dark }]}>
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
    if (prevProps.duration === nextProps.duration && prevProps.progress === nextProps.duration)
      return true;
    else return false;
  },
);
