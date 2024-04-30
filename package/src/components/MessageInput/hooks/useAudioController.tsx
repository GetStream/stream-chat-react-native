import { useEffect, useRef, useState } from 'react';

import { Alert, Platform } from 'react-native';

import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import {
  Audio,
  AudioRecordingReturnType,
  PlaybackStatus,
  RecordingStatus,
  Sound,
  SoundReturnType,
  triggerHaptic,
} from '../../../native';
import { File } from '../../../types/types';
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

  const { sendMessage, uploadNewFile } = useMessageInputContext();

  // For playback support in Expo CLI apps
  const soundRef = useRef<SoundReturnType | null>(null);

  // Effect to stop the player when the component unmounts
  useEffect(
    () => () => {
      stopVoicePlayer();
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
        if (status.currentPosition && status.duration)
          onVoicePlayerProgressHandler(status.currentPosition, status.duration);
        // For Expo CLI
        else if (status.positionMillis && status.durationMillis)
          onVoicePlayerProgressHandler(status.positionMillis, status.durationMillis);
      }
    }
  };

  const onVoicePlayerPlayPause = async () => {
    if (paused) {
      if (progress === 0) await startVoicePlayer();
      else {
        // For Native CLI
        if (Audio.resumePlayer) await Audio.resumePlayer();
        // For Expo CLI
        if (soundRef.current?.playAsync) await soundRef.current.playAsync();
      }
    } else {
      // For Native CLI
      if (Audio.pausePlayer) await Audio.pausePlayer();
      // For Expo CLI
      if (soundRef.current?.pauseAsync) await soundRef.current.pauseAsync();
    }
    setPaused(!paused);
  };

  /**
   * Function to start playing voice recording to preview it after recording.
   */
  const startVoicePlayer = async () => {
    if (!recording) return;
    // For Native CLI
    if (Audio.startPlayer)
      await Audio.startPlayer(recording, {}, onVoicePlayerPlaybackStatusUpdate);
    // For Expo CLI
    if (recording && typeof recording !== 'string') {
      const uri = recording.getURI();
      if (uri) {
        soundRef.current = await Sound.initializeSound(
          { uri },
          {},
          onVoicePlayerPlaybackStatusUpdate,
        );
        if (soundRef.current?.playAsync && soundRef.current.setProgressUpdateIntervalAsync) {
          await soundRef.current.playAsync();
          await soundRef.current.setProgressUpdateIntervalAsync(
            Platform.OS === 'android' ? 100 : 60,
          );
        }
      }
    }
  };

  /**
   * Function to stop playing voice recording.
   */
  const stopVoicePlayer = async () => {
    // For Native CLI
    if (Audio.stopPlayer) {
      await Audio.stopPlayer();
    }
    // For Expo CLI
    if (recording && typeof recording !== 'string') {
      if (soundRef.current?.stopAsync && soundRef.current?.unloadAsync) {
        await soundRef.current.stopAsync();
        await soundRef.current?.unloadAsync();
      }
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
    setRecordingStatus('recording');
    const recordingInfo = await Audio.startRecording(
      {
        isMeteringEnabled: true,
      },
      onRecordingStatusUpdate,
    );
    const accessGranted = recordingInfo.accessGranted;
    if (accessGranted) {
      setPermissionsGranted(true);
      const recording = recordingInfo.recording;
      if (recording && typeof recording !== 'string') {
        recording.setProgressUpdateInterval(Platform.OS === 'android' ? 100 : 60);
      }
      setRecording(recording);
      await stopVoicePlayer();
    } else {
      setPermissionsGranted(false);
      resetState();
      Alert.alert('Please allow Audio permissions in settings.');
    }
  };

  /**
   * Function to stop voice recording.
   */
  const stopVoiceRecording = async () => {
    if (recording) {
      // For Expo CLI
      if (typeof recording !== 'string') {
        await recording.stopAndUnloadAsync();
        await Audio.stopRecording();
      }
      // For RN CLI
      else {
        await Audio.stopRecording();
      }
    }
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
    triggerHaptic('impactMedium');
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

    const file: File = {
      duration: durationInSeconds,
      mimeType: 'audio/aac',
      name: `audio_recording_${new Date().toISOString()}.aac`,
      type: 'voiceRecording',
      uri: typeof recording !== 'string' ? (recording?.getURI() as string) : (recording as string),
      waveform_data: resampledWaveformData,
    };

    if (multiSendEnabled) {
      await uploadNewFile(file);
    } else {
      // FIXME: cannot call handleSubmit() directly as the function has stale reference to file uploads
      await uploadNewFile(file);
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
