import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ImageGalleryFooterVideoControlProps } from './ImageGalleryFooter';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStateStore } from '../../../hooks/useStateStore';
import { Pause, Play } from '../../../icons';
import { VideoPlayerState } from '../../../state-store/video-player';
import { getDurationLabelFromDuration } from '../../../utils/utils';
import { ProgressControl } from '../../ProgressControl/ProgressControl';
import { useImageGalleryVideoPlayer } from '../hooks/useImageGalleryVideoPlayer';

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

const videoPlayerSelector = (state: VideoPlayerState) => ({
  duration: state.duration,
  isPlaying: state.isPlaying,
  progress: state.progress,
});

export const ImageGalleryVideoControl = React.memo((props: ImageGalleryFooterVideoControlProps) => {
  const { attachmentId } = props;

  const videoPlayer = useImageGalleryVideoPlayer({
    id: attachmentId,
  });

  const { duration, isPlaying, progress } = useStateStore(videoPlayer.state, videoPlayerSelector);

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

  const handlePlayPause = () => {
    videoPlayer.toggle();
  };

  return (
    <View style={[styles.videoContainer, videoContainer]}>
      <TouchableOpacity accessibilityLabel='Play Pause Button' onPress={handlePlayPause}>
        <View style={[styles.roundedView, { backgroundColor: static_white }, roundedView]}>
          {!isPlaying ? (
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
});

ImageGalleryVideoControl.displayName = 'ImageGalleryVideoControl{imageGallery{videoControl}}';
