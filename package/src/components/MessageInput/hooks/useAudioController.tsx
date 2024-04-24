import { useEffect, useRef, useState } from 'react';

import { Alert, Platform } from 'react-native';

import { useMessageInputContext } from '../../../contexts/messageInputContext/MessageInputContext';
import {
  Audio,
  PlaybackStatus,
  RecordingStatus,
  Sound,
  SoundReturnType,
  triggerHaptic,
} from '../../../native';
import { File } from '../../../types/types';
import { resampleWaveformData } from '../utils/audioSampling';
import { normalizeAudioLevel } from '../utils/normalizeAudioLevel';

export const useAudioController = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(true);
  const [progress, setProgress] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [paused, setPaused] = useState<boolean>(true);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isScheduledForSubmit, setIsScheduleForSubmit] = useState(false);

  const {
    recording,
    recordingDuration,
    recordingStopped,
    sendMessage,
    setMicLocked,
    setRecording,
    setRecordingDuration,
    setRecordingStopped,
    setShowVoiceUI,
    uploadNewFile,
  } = useMessageInputContext();

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

  const startVoicePlayer = async () => {
    if (!recording) return;
    console.log('startVoicePlayer');
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

  const stopVoicePlayer = async () => {
    console.log('stopVoicePlayer');
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
    // For expo android the lower bound is -160 so we need to normalize according to it.
    const normalizedAudioLevel = normalizeAudioLevel(
      status.currentMetering || status.metering,
      Platform.OS === 'android' && typeof recording !== 'string',
    );
    setWaveformData((prev) => [...prev, normalizedAudioLevel]);
  };

  const startVoiceRecording = async () => {
    setShowVoiceUI(true);
    setRecordingStopped(false);
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
    setRecordingStopped(true);
  };

  const resetState = () => {
    setRecordingStopped(true);
    setShowVoiceUI(false);
    setMicLocked(false);
    setWaveformData([]);
    setPaused(true);
    setPosition(0);
    setProgress(0);
  };

  const deleteVoiceRecording = async () => {
    if (!recordingStopped) {
      await stopVoiceRecording();
    }
    if (!paused) {
      await stopVoicePlayer();
    }
    resetState();
    triggerHaptic('impactMedium');
  };

  const uploadVoiceRecording = async (multiSendEnabled: boolean) => {
    if (!paused) {
      await stopVoicePlayer();
    }
    if (!recordingStopped) {
      await stopVoiceRecording();
    }

    const durationInSeconds = parseFloat((recordingDuration / 1000).toFixed(3));

    const resampledWaveformData = resampleWaveformData(waveformData, 100);

    const file: File = {
      duration: durationInSeconds,
      mimeType: 'audio/aac',
      name: 'Recording',
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
    onVoicePlayerPlayPause,
    paused,
    permissionsGranted,
    position,
    progress,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
    waveformData,
  };
};
