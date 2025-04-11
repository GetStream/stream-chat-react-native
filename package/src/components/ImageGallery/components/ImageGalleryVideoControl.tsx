import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ImageGalleryFooterVideoControlProps } from './ImageGalleryFooter';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { Pause, Play } from '../../../icons';
import { getDurationLabelFromDuration } from '../../../utils/utils';
import { ProgressControl } from '../../ProgressControl/ProgressControl';

const styles = StyleSheet.create({
  durationTextStyle: {
    fontWeight: 'bold',
    marginLeft: 16,
  },
  progressContainer: {
    flex: 1,
  },
  progressDurationText: {
    fontWeight: 'bold',
    marginRight: 16,
  },
  roundedView: {
    alignItems: 'center',
    borderRadius: 50,
    display: 'flex',
    elevation: 2,
    height: 36,
    justifyContent: 'center',
    marginRight: 16,
    width: 36,
  },
  videoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(52, 52, 52, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 12,
  },
});

export const ImageGalleryVideoControl = React.memo(
  (props: ImageGalleryFooterVideoControlProps) => {
    const { duration, onPlayPause, paused, progress, videoRef } = props;

    const videoDuration = getDurationLabelFromDuration(duration);

    const progressValueInSeconds = progress * duration;

    const progressDuration = getDurationLabelFromDuration(progressValueInSeconds);

    const {
      theme: {
        colors: { accent_blue, black, static_black, static_white },
        imageGallery: {
          videoControl: { durationTextStyle, progressDurationText, roundedView, videoContainer },
        },
      },
    } = useTheme();

    const handlePlayPause = async () => {
      // Note: Not particularly sure why this was ever added, but
      // will keep it for now for backwards compatibility.
      if (progress === 1) {
        // For expo CLI
        if (videoRef.current?.replay) {
          await videoRef.current.replay();
        }
      }
      onPlayPause();
    };

    return (
      <View style={[styles.videoContainer, videoContainer]}>
        <TouchableOpacity accessibilityLabel='Play Pause Button' onPress={handlePlayPause}>
          <View style={[styles.roundedView, { backgroundColor: static_white }, roundedView]}>
            {paused ? (
              <Play accessibilityLabel='Play Icon' fill={static_black} height={32} width={32} />
            ) : (
              <Pause accessibilityLabel='Pause Icon' fill={static_black} height={32} width={32} />
            )}
          </View>
        </TouchableOpacity>
        <Text
          accessibilityLabel='Progress Duration'
          style={[styles.progressDurationText, { color: black }, progressDurationText]}
        >
          {progressDuration}
        </Text>
        <View style={styles.progressContainer}>
          <ProgressControl
            duration={duration}
            filledColor={accent_blue}
            progress={progress}
            testID={'progress-control'}
            width={180}
          />
        </View>

        <Text
          accessibilityLabel='Video Duration'
          style={[styles.durationTextStyle, { color: black }, durationTextStyle]}
        >
          {videoDuration}
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
