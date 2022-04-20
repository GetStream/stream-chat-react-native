import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import dayjs from 'dayjs';

import { ProgressControl } from './ProgressControl';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { Pause, Play } from '../../../icons';

export type ImageGalleryProps = {
  duration: number;
  onPlayPause: () => void;
  onProgressDrag: (progress: number) => void;
  paused: boolean;
  progress: number;
};

const styles = StyleSheet.create({
  durationTextStyle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  roundedView: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    display: 'flex',
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(52, 52, 52, 0.1)',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
});

export const ImageGalleryVideoControl: React.FC<ImageGalleryProps> = React.memo(
  (props) => {
    const { duration, onPlayPause, onProgressDrag, paused, progress } = props;

    const videoDuration = duration
      ? duration / 3600 >= 1
        ? dayjs.duration(duration, 'second').format('HH:mm:ss')
        : dayjs.duration(duration, 'second').format('mm:ss')
      : null;

    const progressValueInSeconds = progress * duration;

    const progressDuration = progressValueInSeconds
      ? progressValueInSeconds / 3600 >= 1
        ? dayjs.duration(progressValueInSeconds, 'second').format('HH:mm:ss')
        : dayjs.duration(progressValueInSeconds, 'second').format('mm:ss')
      : null;

    const {
      theme: {
        imageGallery: {
          videoControl: { durationTextStyle, roundedView, videoContainer },
        },
      },
    } = useTheme();

    return (
      <View style={[styles.videoContainer, videoContainer]}>
        <TouchableOpacity onPress={onPlayPause}>
          <View style={[styles.roundedView, roundedView]}>
            {paused ? (
              <Play height={24} pathFill={'#000'} width={24} />
            ) : (
              <Pause height={24} width={24} />
            )}
          </View>
        </TouchableOpacity>
        <Text style={[styles.durationTextStyle, durationTextStyle]}>
          {progressDuration ? progressDuration : '00:00'}
        </Text>
        <ProgressControl duration={duration} onProgressDrag={onProgressDrag} progress={progress} />
        <Text style={[styles.durationTextStyle, durationTextStyle]}>
          {videoDuration ? videoDuration : '00:00'}
        </Text>
      </View>
    );
  },
  (prevProps, nextProps) => {
    if (
      prevProps.duration === nextProps.duration &&
      prevProps.paused === nextProps.paused &&
      prevProps.progress === nextProps.progress
    ) {
      return true;
    } else {
      return false;
    }
  },
);

ImageGalleryVideoControl.displayName = 'ImageGalleryVideoControl{imageGallery{videoControl}}';
