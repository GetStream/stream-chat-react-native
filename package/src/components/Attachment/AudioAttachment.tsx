import React, { RefObject, useEffect, useMemo } from 'react';
import { I18nManager, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import {
  isVoiceRecordingAttachment,
  LocalMessage,
  AudioAttachment as StreamAudioAttachment,
  VoiceRecordingAttachment as StreamVoiceRecordingAttachment,
} from 'stream-chat';

import { useTheme } from '../../contexts';
import { useStateStore } from '../../hooks';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { Audio } from '../../icons';
import { NewPause } from '../../icons/NewPause';
import { NewPlay } from '../../icons/NewPlay';
import {
  NativeHandlers,
  SoundReturnType,
  VideoPayloadData,
  VideoProgressData,
  VideoSeekResponse,
} from '../../native';
import { AudioPlayerState } from '../../state-store/audio-player';
import { AudioConfig } from '../../types/types';
import { getTrimmedAttachmentTitle } from '../../utils/getTrimmedAttachmentTitle';
import { ProgressControl } from '../ProgressControl/ProgressControl';
import { WaveProgressBar } from '../ProgressControl/WaveProgressBar';

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
  titleMaxLength?: number;
  hideProgressBar?: boolean;
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
  maxAmplitudesCount?: number;
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

  const {
    hideProgressBar = false,
    item,
    message,
    showSpeedSettings = false,
    testID,
    titleMaxLength,
    isPreview = false,
    containerStyle,
    maxAmplitudesCount = 30,
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
        leftContainer,
        playPauseButton,
        progressControlContainer,
        progressDurationText,
        rightContainer,
        speedChangeButton,
        speedChangeButtonText,
      },
      colors: { accent, border, text, black, static_white, white },
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
      style={[
        styles.container,
        {
          backgroundColor: white,
          borderColor: border.default,
        },
        container,
        containerStyle,
      ]}
      testID={testID}
    >
      <View style={[styles.leftContainer, leftContainer]}>
        <Pressable
          accessibilityLabel='Play Pause Button'
          onPress={handlePlayPause}
          style={[
            styles.playPauseButton,
            { backgroundColor: static_white, borderColor: border.default },
            playPauseButton,
          ]}
        >
          {!isPlaying ? (
            <NewPlay fill={text.secondary} height={20} width={20} />
          ) : (
            <NewPause fill={text.secondary} height={20} width={20} />
          )}
        </Pressable>
      </View>
      <View style={[styles.centerContainer]}>
        <Text
          accessibilityLabel='File Name'
          numberOfLines={1}
          style={[
            styles.filenameText,
            {
              color: text.primary,
            },
            I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
            filenameText,
          ]}
        >
          {isVoiceRecordingAttachment(item)
            ? 'Voice Message'
            : getTrimmedAttachmentTitle(item.title, titleMaxLength)}
        </Text>
        <View style={styles.audioInfo}>
          <Text
            style={[
              styles.progressDurationText,
              { color: isPlaying ? accent.primary : text.secondary },
              progressDurationText,
            ]}
          >
            {progressDuration}
          </Text>
          {!hideProgressBar && (
            <View style={[styles.progressControlContainer, progressControlContainer]}>
              {item.waveform_data ? (
                <WaveProgressBar
                  amplitudesCount={maxAmplitudesCount}
                  onEndDrag={dragEnd}
                  onProgressDrag={dragProgress}
                  onStartDrag={dragStart}
                  progress={progress}
                  waveformData={item.waveform_data}
                />
              ) : (
                <ProgressControl
                  filledColor={accent.primary}
                  onEndDrag={dragEnd}
                  onStartDrag={dragStart}
                  progress={progress}
                  testID='progress-control'
                />
              )}
            </View>
          )}
        </View>
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
      {showSpeedSettings ? (
        <View style={[styles.rightContainer, rightContainer]}>
          {!isPlaying ? (
            <Audio fill={'#ffffff'} />
          ) : (
            <Pressable
              onPress={onSpeedChangeHandler}
              style={[
                styles.speedChangeButton,
                { backgroundColor: static_white, shadowColor: black },
                speedChangeButton,
              ]}
            >
              <Text
                style={[styles.speedChangeButtonText, speedChangeButtonText]}
              >{`x${currentPlaybackRate.toFixed(1)}`}</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  audioInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  centerContainer: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: 224, // TODO: Not sure how to omit this
    gap: 12,
  },
  filenameText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 8,
  },
  leftContainer: {},
  playPauseButton: {
    alignItems: 'center',
    borderRadius: 50,
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
  },
  progressControlContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  progressDurationText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginRight: 8,
  },
  rightContainer: {
    marginLeft: 16,
  },
  speedChangeButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 50,
    elevation: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  speedChangeButtonText: {
    fontSize: 12,
  },
});

AudioAttachment.displayName = 'AudioAttachment{messageInput{audioAttachment}}';
