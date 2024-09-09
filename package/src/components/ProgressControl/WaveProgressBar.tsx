import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { triggerHaptic } from '../../native';
import { resampleWaveformData } from '../MessageInput/utils/audioSampling';

export type WaveProgressBarProps = {
  progress: number;
  waveformData: number[];
  amplitudesCount?: number;
  filledColor?: string;
  onPlayPause?: (status?: boolean) => void;
  onProgressDrag?: (progress: number) => void;
};

const WAVEFORM_WIDTH = 2;

const ProgressControlThumb = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const {
    theme: {
      colors: { black, grey_dark, static_white },
    },
  } = useTheme();
  return (
    <Pressable style={{ height: 40, justifyContent: 'center', width: 40 }}>
      <View
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
    </Pressable>
  );
};

export const WaveProgressBar = React.memo(
  (props: WaveProgressBarProps) => {
    const [endPosition, setEndPosition] = useState(0);
    const [currentWaveformProgress, setCurrentWaveformProgress] = useState(0);
    /* On Android, the seek doesn't work for AAC files, hence we disable progress drag for now */
    const showProgressDrag = Platform.OS === 'ios';
    const {
      amplitudesCount = 70,
      filledColor,
      onPlayPause,
      onProgressDrag,
      progress,
      waveformData,
    } = props;
    const {
      theme: {
        colors: { accent_blue, grey_dark },
        waveProgressBar: { container, thumb, waveform: waveformTheme },
      },
    } = useTheme();
    const state = useSharedValue(0);

    useEffect(() => {
      const stageProgress = Math.floor(
        progress * (showProgressDrag ? amplitudesCount - 1 : amplitudesCount),
      );
      state.value = stageProgress * (WAVEFORM_WIDTH * 2);
      setEndPosition(state.value);
      setCurrentWaveformProgress(stageProgress);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [progress]);

    const stringifiedWaveformData = waveformData.toString();

    const resampledWaveformData = useMemo(
      () => resampleWaveformData(waveformData, amplitudesCount),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [amplitudesCount, stringifiedWaveformData],
    );

    const thumbStyles = useAnimatedStyle(() => ({
      position: 'absolute',
      transform: [{ translateX: state.value }],
    }));

    const onGestureEvent = useAnimatedGestureHandler(
      {
        onActive: (event) => {
          const stage = Math.floor((endPosition + event.translationX) / (WAVEFORM_WIDTH * 2));
          runOnJS(setCurrentWaveformProgress)(stage);
          state.value = stage * (WAVEFORM_WIDTH * 2);
          if (state.value < 0) {
            state.value = 0;
          } else if (state.value > amplitudesCount * (WAVEFORM_WIDTH * 2)) {
            state.value = (amplitudesCount - 1) * (WAVEFORM_WIDTH * 2);
          } else {
            runOnJS(triggerHaptic)('impactLight');
          }
        },
        onFinish: () => {
          const stage = Math.floor(state.value / (WAVEFORM_WIDTH * 2));
          runOnJS(setEndPosition)(state.value);
          if (onProgressDrag) runOnJS(onProgressDrag)(stage);
          if (onPlayPause) runOnJS(onPlayPause)(false);
        },
        onStart: () => {
          if (onPlayPause) runOnJS(onPlayPause)(true);
          state.value = endPosition;
        },
      },
      [amplitudesCount, endPosition],
    );

    return (
      <View style={[styles.container, container]}>
        {resampledWaveformData.map((waveform, index) => (
          <View
            key={index}
            style={[
              styles.waveform,
              {
                backgroundColor:
                  index < currentWaveformProgress ? filledColor || accent_blue : grey_dark,
                height: waveform * 25 > 3 ? waveform * 25 : 3,
              },
              waveformTheme,
            ]}
          />
        ))}
        {showProgressDrag && onProgressDrag && (
          <PanGestureHandler maxPointers={1} onGestureEvent={onGestureEvent}>
            <Animated.View style={[thumbStyles, thumb]}>
              <ProgressControlThumb />
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.amplitudesCount !== nextProps.amplitudesCount) return false;
    if (prevProps.progress !== nextProps.progress) return false;
    else return true;
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  progressControlThumbStyle: {
    borderRadius: 5,
    borderWidth: 0.2,
    elevation: 6,
    height: 25,
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
    marginHorizontal: WAVEFORM_WIDTH / 2,
    width: WAVEFORM_WIDTH,
  },
});

WaveProgressBar.displayName = 'WaveProgressBar';
