import React, { RefObject, useEffect, useMemo } from 'react';
import { I18nManager, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import {
  isLocalVoiceRecordingAttachment,
  isVoiceRecordingAttachment,
  LocalMessage,
  AudioAttachment as StreamAudioAttachment,
  VoiceRecordingAttachment as StreamVoiceRecordingAttachment,
} from 'stream-chat';

import { PlayPauseButton } from './PlayPauseButton';

import { useTheme } from '../../../contexts';
import { useStateStore } from '../../../hooks';
import { useAudioPlayer } from '../../../hooks/useAudioPlayer';
import {
  NativeHandlers,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
  VideoSeekResponse,
} from '../../../native';
import { AudioPlayerState } from '../../../state-store/audio-player';
import { primitives } from '../../../theme';
import { AudioConfig } from '../../../types/types';
import { ProgressControl } from '../../ProgressControl/ProgressControl';
import { WaveProgressBar } from '../../ProgressControl/WaveProgressBar';
import { SpeedSettingsButton } from '../../ui/SpeedSettingsButton';

const ONE_HOUR_IN_MILLISECONDS = 3600 * 1000;
const ONE_SECOND_IN_MILLISECONDS = 1000;

dayjs.extend(duration);

export type AudioAttachmentType = AudioConfig &
  Pick<
    StreamAudioAttachment | StreamVoiceRecordingAttachment,
    'waveform_data' | 'asset_url' | 'title' | 'mime_type'
  > & {
    id: string;
    type: 'audio' | 'voiceRecording';
  };

export type AudioAttachmentProps = {
  item: AudioAttachmentType;
  message?: LocalMessage;
  hideProgressBar?: boolean;
  showTitle?: boolean;
  /**
   * If true, the speed settings button will be shown.
   */
  showSpeedSettings?: boolean;
  testID?: string;
  /**
   * If true, the audio attachment is in preview mode in the message input.
   */
  isPreview?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  indicator?: React.ReactNode;
  styles?: {
    container?: StyleProp<ViewStyle>;
    playPauseButton?: StyleProp<ViewStyle>;
    speedSettingsButton?: StyleProp<ViewStyle>;
    durationText?: StyleProp<TextStyle>;
  };
};

const audioPlayerSelector = (state: AudioPlayerState) => ({
  currentPlaybackRate: state.currentPlaybackRate,
  duration: state.duration,
  isPlaying: state.isPlaying,
  position: state.position,
  progress: state.progress,
});

/**
 * AudioAttachment
 * UI Component to preview the audio files
 */
export const AudioAttachment = (props: AudioAttachmentProps) => {
  const soundRef = React.useRef<SoundReturnType | null>(null);
  const styles = useStyles();
  const {
    hideProgressBar = false,
    item,
    message,
    showSpeedSettings = false,
    showTitle = true,
    testID,
    isPreview = false,
    containerStyle,
    styles: stylesProps,
    indicator,
  } = props;
  const isVoiceRecording = isVoiceRecordingAttachment(item);

  const audioPlayer = useAudioPlayer({
    duration: item.duration ?? 0,
    mimeType: item.mime_type ?? '',
    requester: isPreview
      ? 'preview'
      : message?.id && `${message?.parent_id ?? message?.id}${message?.id}`,
    type: isVoiceRecording ? 'voiceRecording' : 'audio',
    uri: item.asset_url ?? '',
  });
  const { duration, isPlaying, position, progress, currentPlaybackRate } = useStateStore(
    audioPlayer.state,
    audioPlayerSelector,
  );

  // Initialize the player for native cli apps
  useEffect(() => {
    if (soundRef.current) {
      audioPlayer.initPlayer({ playerRef: soundRef.current });
    }
  }, [audioPlayer]);

  // When a audio attachment in preview is removed, we need to remove the player from the pool
  useEffect(
    () => () => {
      if (isPreview) {
        audioPlayer.onRemove();
      }
    },
    [audioPlayer, isPreview],
  );

  /** This is for Native CLI Apps */
  const handleLoad = (payload: VideoPayloadData) => {
    // If the attachment is a voice recording, we rely on the duration from the attachment as the one from the react-native-video is incorrect.
    if (isVoiceRecording) {
      return;
    }
    audioPlayer.duration = payload.duration * ONE_SECOND_IN_MILLISECONDS;
  };

  /** This is for Native CLI Apps */
  const handleProgress = (data: VideoProgressData) => {
    const { currentTime } = data;
    audioPlayer.position = currentTime * ONE_SECOND_IN_MILLISECONDS;
  };

  /** This is for Native CLI Apps */
  const onSeek = (seekResponse: VideoSeekResponse) => {
    audioPlayer.position = seekResponse.currentTime * ONE_SECOND_IN_MILLISECONDS;
  };

  const handlePlayPause = () => {
    audioPlayer.toggle();
  };

  const handleEnd = async () => {
    await audioPlayer.stop();
  };

  const dragStart = () => {
    audioPlayer.pause();
  };

  const dragProgress = (currentProgress: number) => {
    audioPlayer.progress = currentProgress;
  };

  const dragEnd = async (currentProgress: number) => {
    const positionInSeconds = (currentProgress * duration) / ONE_SECOND_IN_MILLISECONDS;
    await audioPlayer.seek(positionInSeconds);
    audioPlayer.play();
  };

  const onSpeedChangeHandler = async () => {
    await audioPlayer.changePlaybackRate();
  };

  const {
    theme: {
      audioAttachment: {
        container,
        centerContainer,
        audioInfo,
        leftContainer,
        progressControlContainer,
        progressDurationText,
        rightContainer,
      },
      semantics,
      messageInput: {
        fileAttachmentUploadPreview: { filenameText },
      },
    },
  } = useTheme();

  const progressDuration = useMemo(
    () =>
      position
        ? position / ONE_HOUR_IN_MILLISECONDS >= 1
          ? dayjs.duration(position, 'milliseconds').format('HH:mm:ss')
          : dayjs.duration(position, 'milliseconds').format('mm:ss')
        : dayjs.duration(duration, 'milliseconds').format('mm:ss'),
    [duration, position],
  );

  return (
    <View
      accessibilityLabel='audio-attachment-preview'
      style={[styles.container, container, containerStyle, stylesProps?.container]}
      testID={testID}
    >
      <View style={[styles.leftContainer, leftContainer]}>
        <PlayPauseButton
          isPlaying={isPlaying}
          accessibilityLabel='Play Pause Button'
          onPress={handlePlayPause}
          containerStyle={stylesProps?.playPauseButton}
        />
      </View>
      <View
        style={[
          styles.centerContainer,
          {
            flexGrow: 1,
            flexShrink: showTitle ? 1 : 0,
          },
          centerContainer,
        ]}
      >
        {showTitle ? (
          <Text
            accessibilityLabel='File Name'
            numberOfLines={1}
            style={[
              styles.filenameText,
              I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
              filenameText,
            ]}
          >
            {isVoiceRecordingAttachment(item) || isLocalVoiceRecordingAttachment(item)
              ? 'Voice Message'
              : item.title}
          </Text>
        ) : null}

        {indicator ? (
          indicator
        ) : (
          <View style={[styles.audioInfo, audioInfo]}>
            <Text
              style={[
                styles.progressDurationText,
                { color: isPlaying ? semantics.accentPrimary : semantics.textSecondary },
                progressDurationText,
                stylesProps?.durationText,
              ]}
            >
              {progressDuration}
            </Text>
            {!hideProgressBar && (
              <View style={[styles.progressControlContainer, progressControlContainer]}>
                {item.waveform_data ? (
                  <WaveProgressBar
                    isPlaying={isPlaying}
                    onEndDrag={dragEnd}
                    onProgressDrag={dragProgress}
                    onStartDrag={dragStart}
                    progress={progress}
                    waveformData={item.waveform_data}
                  />
                ) : (
                  <ProgressControl
                    isPlaying={isPlaying}
                    onEndDrag={dragEnd}
                    onStartDrag={dragStart}
                    progress={progress}
                    testID='progress-control'
                  />
                )}
              </View>
            )}
          </View>
        )}
        {NativeHandlers.Sound?.Player && (
          <NativeHandlers.Sound.Player
            onEnd={handleEnd}
            onLoad={handleLoad}
            onProgress={handleProgress}
            onSeek={onSeek}
            paused={!isPlaying}
            rate={currentPlaybackRate}
            soundRef={soundRef as RefObject<SoundReturnType>}
            testID='sound-player'
            uri={item.asset_url}
          />
        )}
      </View>
      {showSpeedSettings && !indicator ? (
        <View style={[styles.rightContainer, rightContainer]}>
          <SpeedSettingsButton
            currentPlaybackRate={currentPlaybackRate}
            onPress={onSpeedChangeHandler}
            containerStyle={stylesProps?.speedSettingsButton}
          />
        </View>
      ) : null}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: primitives.spacingSm,
        gap: primitives.spacingXs,
        minWidth: 256, // TODO: Fix this
        borderColor: semantics.borderCoreDefault,
        borderWidth: 1,
      },
      audioInfo: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      centerContainer: {
        gap: primitives.spacingXxs,
      },
      filenameText: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
      leftContainer: {
        padding: primitives.spacingXxs,
      },
      progressControlContainer: {
        flex: 1,
      },
      progressDurationText: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      rightContainer: {},
    });
  }, [semantics]);
};

AudioAttachment.displayName = 'AudioAttachment{messageInput{audioAttachment}}';
