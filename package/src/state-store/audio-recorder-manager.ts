import { Platform } from 'react-native';

import { StateStore } from 'stream-chat';

import { normalizeAudioLevel } from '../components/MessageInput/utils/normalizeAudioLevel';
import { AudioRecordingReturnType, NativeHandlers, RecordingStatus } from '../native';

export type RecordingStatusStates = 'idle' | 'recording' | 'stopped';

export type AudioRecorderManagerState = {
  micLocked: boolean;
  recording: AudioRecordingReturnType;
  waveformData: number[];
  duration: number;
  status: RecordingStatusStates;
};

const INITIAL_STATE: AudioRecorderManagerState = {
  micLocked: false,
  waveformData: [],
  recording: undefined,
  duration: 0,
  status: 'idle',
};

export class AudioRecorderManager {
  state: StateStore<AudioRecorderManagerState>;

  constructor() {
    this.state = new StateStore<AudioRecorderManagerState>(INITIAL_STATE);
  }

  reset() {
    this.state.next(INITIAL_STATE);
  }

  onRecordingStatusUpdate = (status: RecordingStatus) => {
    if (status.isDoneRecording === true) {
      return;
    }
    this.state.partialNext({ duration: status?.currentPosition || status.durationMillis });
    // For expo android the lower bound is -120 so we need to normalize according to it. The `status.currentMetering` is undefined for Expo CLI apps, so we can use it.
    const lowerBound = Platform.OS === 'ios' || status.currentMetering ? -60 : -120;
    const normalizedAudioLevel = normalizeAudioLevel(
      status.currentMetering || status.metering,
      lowerBound,
    );
    this.state.partialNext({
      waveformData: [...this.state.getLatestValue().waveformData, normalizedAudioLevel],
    });
  };

  async startRecording() {
    if (!NativeHandlers.Audio) {
      return;
    }
    const recordingInfo = await NativeHandlers.Audio.startRecording(
      {
        isMeteringEnabled: true,
      },
      this.onRecordingStatusUpdate,
    );
    const { accessGranted, recording } = recordingInfo;
    if (accessGranted && recording) {
      if (recording && typeof recording !== 'string' && recording.setProgressUpdateInterval) {
        recording.setProgressUpdateInterval(Platform.OS === 'android' ? 100 : 60);
      }
      this.state.partialNext({ recording, status: 'recording' });
    } else {
      this.reset();
    }

    return accessGranted;
  }

  async stopRecording() {
    if (!NativeHandlers.Audio) {
      return;
    }
    await NativeHandlers.Audio.stopRecording();
    this.state.partialNext({ status: 'stopped' });
  }

  set micLocked(value: boolean) {
    this.state.partialNext({ micLocked: value });
  }

  set status(value: RecordingStatusStates) {
    this.state.partialNext({ status: value });
  }
}
