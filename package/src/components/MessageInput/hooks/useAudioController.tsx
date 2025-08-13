import { useEffect, useRef, useState } from 'react';

import { Alert, Platform } from 'react-native';

import { LocalVoiceRecordingAttachment } from 'stream-chat';

import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';

import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import {
  AudioRecordingReturnType,
  NativeHandlers,
  PlaybackStatus,
  RecordingStatus,
  SoundReturnType,
} from '../../../native';
import type { File } from '../../../types/types';
import { FileTypes } from '../../../types/types';
import { generateRandomId } from '../../../utils/utils';
import { resampleWaveformData } from '../utils/audioSampling';
import { normalizeAudioLevel } from '../utils/normalizeAudioLevel';

export type RecordingStatusStates = 'idle' | 'recording' | 'stopped';

/**
 * The hook that controls all the async audio core features including start/stop or recording, player, upload/delete of the recorded audio.
 */
export const useAudioController = () => {
  const [micLocked, setMicLocked] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(true);
  const [paused, setPaused] = useState<boolean>(true);
  const [position, setPosition] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isScheduledForSubmit, setIsScheduleForSubmit] = useState(false);
  const [recording, setRecording] = useState<AudioRecordingReturnType>(undefined);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatusStates>('idle');
  const { attachmentManager } = useMessageComposer();

  const { sendMessage } = useMessageInputContext();

  // For playback support in Expo CLI apps
  const soundRef = useRef<SoundReturnType | null>(null);

  // This effect stop the player from playing and stops audio recording on
  // the audio SDK side on unmount.
  useEffect(
    () => () => {
      stopVoicePlayer();
      stopSDKVoiceRecording();
    },
    [],
  );

  useEffect(() => {
    if (isScheduledForSubmit) {
      sendMessage();
      setIsScheduleForSubmit(false);
    }
  }, [isScheduledForSubmit, sendMessage]);

  const onVoicePlayerProgressHandler = (currentPosition: number, playbackDuration: number) => {
    const currentProgress = currentPosition / playbackDuration;
    if (currentProgress === 1) {
      setPaused(true);
      setProgress(0);
    } else {
      setProgress(currentProgress);
    }
  };

  const onVoicePlayerPlaybackStatusUpdate = (status: PlaybackStatus) => {
    if (status.shouldPlay === undefined || status.shouldPlay === true) {
      setPosition(status?.currentPosition || status?.positionMillis);
      setRecordingDuration(status.duration || status.durationMillis);

      if (status.didJustFinish) {
        onVoicePlayerProgressHandler(status.durationMillis, status.durationMillis);
      } else {
        // For Native CLI
        if (status.currentPosition && status.duration) {
          onVoicePlayerProgressHandler(status.currentPosition, status.duration);
        }
        // For Expo CLI
        else if (status.positionMillis && status.durationMillis) {
          onVoicePlayerProgressHandler(status.positionMillis, status.durationMillis);
        }
      }
    }
  };

  const onVoicePlayerPlayPause = async () => {
    if (paused) {
      if (progress === 0) {
        await startVoicePlayer();
      } else {
        // For Native CLI
        if (NativeHandlers.Audio?.resumePlayer) {
          await NativeHandlers.Audio.resumePlayer();
        }
        // For Expo CLI
        if (soundRef.current?.playAsync) {
          await soundRef.current.playAsync();
        }
      }
    } else {
      // For Native CLI
      if (NativeHandlers.Audio?.pausePlayer) {
        await NativeHandlers.Audio.pausePlayer();
      }
      // For Expo CLI
      if (soundRef.current?.pauseAsync) {
        await soundRef.current.pauseAsync();
      }
    }
    setPaused(!paused);
  };

  /**
   * Function to start playing voice recording to preview it after recording.
   */
  const startVoicePlayer = async () => {
    if (!recording) {
      return;
    }
    // For Native CLI
    if (NativeHandlers.Audio?.startPlayer) {
      await NativeHandlers.Audio.startPlayer(recording, {}, onVoicePlayerPlaybackStatusUpdate);
    }
    // For Expo CLI
    if (recording && typeof recording !== 'string') {
      const uri = recording.getURI();
      if (uri && NativeHandlers.Sound?.initializeSound) {
        if (soundRef.current?.replayAsync) {
          await soundRef.current.replayAsync({});
        } else {
          soundRef.current = await NativeHandlers.Sound.initializeSound(
            { uri },
            { progressUpdateIntervalMillis: Platform.OS === 'android' ? 100 : 60 },
            onVoicePlayerPlaybackStatusUpdate,
          );
          if (soundRef.current?.playAsync) {
            await soundRef.current.playAsync();
          }
        }
      }
    }
  };

  /**
   * Function to stop playing voice recording.
   */
  const stopVoicePlayer = async () => {
    // For Native CLI
    if (NativeHandlers.Audio?.stopPlayer) {
      await NativeHandlers.Audio.stopPlayer();
    }
    // For Expo CLI
    if (soundRef.current?.stopAsync && soundRef.current?.unloadAsync) {
      await soundRef.current.stopAsync();
      await soundRef.current?.unloadAsync();
    }
  };

  const onRecordingStatusUpdate = (status: RecordingStatus) => {
    if (status.isDoneRecording === true) {
      return;
    }
    setRecordingDuration(status?.currentPosition || status.durationMillis);
    // For expo android the lower bound is -120 so we need to normalize according to it. The `status.currentMetering` is undefined for Expo CLI apps, so we can use it.
    const lowerBound = Platform.OS === 'ios' || status.currentMetering ? -60 : -120;
    const normalizedAudioLevel = normalizeAudioLevel(
      status.currentMetering || status.metering,
      lowerBound,
    );
    setWaveformData((prev) => [...prev, normalizedAudioLevel]);
  };

  /**
   * Function to start voice recording.
   */
  const startVoiceRecording = async () => {
    if (!NativeHandlers.Audio) {
      return;
    }
    const recordingInfo = await NativeHandlers.Audio.startRecording(
      {
        isMeteringEnabled: true,
      },
      onRecordingStatusUpdate,
    );
    const accessGranted = recordingInfo.accessGranted;
    if (accessGranted) {
      setPermissionsGranted(true);
      const recording = recordingInfo.recording;
      if (recording && typeof recording !== 'string' && recording.setProgressUpdateInterval) {
        recording.setProgressUpdateInterval(Platform.OS === 'android' ? 100 : 60);
      }
      setRecording(recording);
      setRecordingStatus('recording');
      await stopVoicePlayer();
    } else {
      setPermissionsGranted(false);
      resetState();
      Alert.alert('Please allow Audio permissions in settings.');
    }
  };

  /**
   * A function that takes care of stopping the voice recording from the library's
   * side only. Meant to be used as a pure function (during unmounting for instance)
   * hence this approach.
   */
  const stopSDKVoiceRecording = async () => {
    if (!NativeHandlers.Audio) {
      return;
    }
    await NativeHandlers.Audio.stopRecording();
  };

  /**
   * Function to stop voice recording.
   */
  const stopVoiceRecording = async () => {
    await stopSDKVoiceRecording();
    setRecordingStatus('stopped');
  };

  /**
   * Function to reset the state of the message input for async voice messages.
   */
  const resetState = () => {
    setRecording(undefined);
    setRecordingStatus('idle');
    setMicLocked(false);
    setWaveformData([]);
    setPaused(true);
    setPosition(0);
    setProgress(0);
  };

  /**
   * Function to delete voice recording.
   */
  const deleteVoiceRecording = async () => {
    if (recordingStatus === 'recording') {
      await stopVoiceRecording();
    }
    if (!paused) {
      await stopVoicePlayer();
    }
    resetState();
    NativeHandlers.triggerHaptic('impactMedium');
  };

  /**
   * Function to upload or send voice recording.
   * @param multiSendEnabled boolean
   */
  const uploadVoiceRecording = async (multiSendEnabled: boolean) => {
    if (!paused) {
      await stopVoicePlayer();
    }
    if (recordingStatus === 'recording') {
      await stopVoiceRecording();
    }

    const durationInSeconds = parseFloat((recordingDuration / 1000).toFixed(3));

    const resampledWaveformData = resampleWaveformData(waveformData, 100);

    const clearFilter = new RegExp('[.:]', 'g');
    const date = new Date().toISOString().replace(clearFilter, '_');

    const file: File = {
      duration: durationInSeconds,
      name: `audio_recording_${date}.aac`,
      size: 0,
      type: 'audio/aac',
      uri: typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string),
      waveform_data: resampledWaveformData,
    };

    const audioFile: LocalVoiceRecordingAttachment = {
      asset_url:
        typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string),
      duration: durationInSeconds,
      file_size: 0,
      localMetadata: {
        file,
        id: generateRandomId(),
        uploadState: 'pending',
      },
      mime_type: 'audio/aac',
      title: `audio_recording_${date}.aac`,
      type: FileTypes.VoiceRecording,
      waveform_data: resampledWaveformData,
    };

    if (multiSendEnabled) {
      await attachmentManager.uploadAttachment(audioFile);
    } else {
      // FIXME: cannot call handleSubmit() directly as the function has stale reference to file uploads
      await attachmentManager.uploadAttachment(audioFile);
      setIsScheduleForSubmit(true);
    }
    resetState();
  };

  return {
    deleteVoiceRecording,
    micLocked,
    onVoicePlayerPlayPause,
    paused,
    permissionsGranted,
    position,
    progress,
    recording,
    recordingDuration,
    recordingStatus,
    setMicLocked,
    setRecording,
    setRecordingDuration,
    setRecordingStatus,
    setWaveformData,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
    waveformData,
  };
};
