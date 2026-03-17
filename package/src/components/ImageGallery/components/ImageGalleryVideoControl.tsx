import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ImageGalleryVideoControlProps } from './ImageGalleryFooter';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStateStore } from '../../../hooks/useStateStore';
import { Pause } from '../../../icons/Pause';
import { Play } from '../../../icons/Play';
import { IconProps } from '../../../icons/utils/base';
import { VideoPlayerState } from '../../../state-store/video-player';
import { primitives } from '../../../theme';
import { getDurationLabelFromDuration } from '../../../utils/utils';
import { ProgressControl } from '../../ProgressControl/ProgressControl';
import { Button } from '../../ui/Button/Button';
import { SpeedSettingsButton } from '../../ui/SpeedSettingsButton';
import { useImageGalleryVideoPlayer } from '../hooks/useImageGalleryVideoPlayer';

const videoPlayerSelector = (state: VideoPlayerState) => ({
  duration: state.duration,
  isPlaying: state.isPlaying,
  progress: state.progress,
  currentPlaybackRate: state.currentPlaybackRate,
});

export const ImageGalleryVideoControl = React.memo((props: ImageGalleryVideoControlProps) => {
  const { attachmentId } = props;

  const videoPlayer = useImageGalleryVideoPlayer({
    id: attachmentId,
  });

  const { duration, isPlaying, progress, currentPlaybackRate } = useStateStore(
    videoPlayer.state,
    videoPlayerSelector,
  );

  const videoDuration = getDurationLabelFromDuration(duration);

  const progressValueInSeconds = progress * duration;

  const progressDuration = getDurationLabelFromDuration(progressValueInSeconds);

  const {
    theme: {
      imageGallery: {
        videoControl: { durationTextStyle, container },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  const renderPlayPauseIcon = useCallback(
    (props: IconProps) =>
      isPlaying ? (
        <Pause {...props} fill={semantics.textSecondary} />
      ) : (
        <Play {...props} fill={semantics.textSecondary} />
      ),
    [isPlaying, semantics.textSecondary],
  );

  const handlePlayPause = async () => {
    await videoPlayer.toggle();
  };

  const onSpeedChangeHandler = async () => {
    await videoPlayer.changePlaybackRate();
  };

  return (
    <View style={[styles.container, container]}>
      <View style={styles.leftContainer}>
        <Button
          accessibilityLabel='Play Pause Button'
          variant='secondary'
          type='ghost'
          size='md'
          onPress={handlePlayPause}
          LeadingIcon={renderPlayPauseIcon}
          iconOnly
        />
        <Text
          accessibilityLabel='Progress Duration'
          style={[styles.durationTextStyle, durationTextStyle]}
        >
          {progressDuration ?? videoDuration}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <ProgressControl
          isPlaying={isPlaying}
          progress={progress}
          testID={'progress-control'}
          width={180}
        />
      </View>

      <SpeedSettingsButton
        currentPlaybackRate={currentPlaybackRate}
        onPress={onSpeedChangeHandler}
      />
    </View>
  );
});

ImageGalleryVideoControl.displayName = 'ImageGalleryVideoControl{imageGallery{videoControl}}';

const useStyles = () => {
  const {
    theme: {
      semantics,
      imageGallery: { videoControl },
    },
  } = useTheme();

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: semantics.backgroundCoreElevation1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingLeft: primitives.spacingSm,
        paddingRight: primitives.spacingMd,
        paddingVertical: primitives.spacingXs,
        gap: primitives.spacingMd,
        ...videoControl.container,
      },
      leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXs,
        ...videoControl.leftContainer,
      },
      durationTextStyle: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        ...videoControl.durationTextStyle,
      },
      progressContainer: {
        flex: 1,
        ...videoControl.progressContainer,
      },
    });
  }, [semantics, videoControl]);
};
