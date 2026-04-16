import { Platform } from 'react-native';

import { StateStore } from 'stream-chat';

import { normalizeAudioLevel } from '../components/MessageInput/utils/normalizeAudioLevel';
import {
  AudioRecordingReturnType,
  AudioReturnType,
  NativeHandlers,
  RecordingStatus,
} from '../native';

export type RecordingStatusStates = 'idle' | 'recording' | 'stopped';

export type AudioRecorderManagerState = {
  isStarting: boolean;
  micLocked: boolean;
  recording: AudioRecordingReturnType;
  waveformData: number[];
  duration: number;
  status: RecordingStatusStates;
};

const INITIAL_STATE: AudioRecorderManagerState = {
  isStarting: false,
  micLocked: false,
  waveformData: [],
  recording: undefined,
  duration: 0,
  status: 'idle',
};

export class AudioRecorderManager {
  state: StateStore<AudioRecorderManagerState>;
  /**
   * A Set signifying whether we've tried to stop a recording session while the
   * startRecording method is still executing. It is useful to identify race
   * conditions where we try to cancel the recording altogether while setting
   * up the recording session finishes (which can take up to 700ms on some
   * slower devices).
   * @private
   */
  private pendingStopRequestIds = new Set<number>();
  /**
   * A request ID for this recording session. Used to identify stale recording
   * sessions and respond adequately, avoiding race conditions.
   * @private
   */
  private startRequestId = 0;

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
    const { isStarting, status } = this.state.getLatestValue();
    if (isStarting || status === 'recording') {
      return true;
    }
    const requestId = ++this.startRequestId;
    this.state.partialNext({
      duration: 0,
      isStarting: true,
      micLocked: false,
      recording: undefined,
      status: 'idle',
      waveformData: [],
    });
    let recordingInfo: AudioReturnType;
    try {
      recordingInfo = await NativeHandlers.Audio.startRecording(
        {
          isMeteringEnabled: true,
        },
        this.onRecordingStatusUpdate,
      );
    } catch {
      this.pendingStopRequestIds.delete(requestId);
      if (requestId === this.startRequestId) {
        this.reset();
      }
      return false;
    }

    const { accessGranted, recording } = recordingInfo;
    if (this.pendingStopRequestIds.has(requestId)) {
      if (accessGranted) {
        try {
          await NativeHandlers.Audio.stopRecording();
        } catch {
          // If stopRecording fails, the native implementation has already stopped the
          // recorder and so we do nothing.
        }
      }
      this.pendingStopRequestIds.delete(requestId);
      if (requestId === this.startRequestId) {
        this.reset();
      }
      return accessGranted;
    }

    if (requestId !== this.startRequestId) {
      // Stale start completion, ignore to avoid affecting newer attempts
      return accessGranted;
    }

    if (accessGranted && recording) {
      if (recording && typeof recording !== 'string' && recording.setProgressUpdateInterval) {
        recording.setProgressUpdateInterval(Platform.OS === 'android' ? 100 : 60);
      }
      this.state.partialNext({ isStarting: false, recording, status: 'recording' });
    } else {
      this.reset();
    }

    return accessGranted;
  }

  async stopRecording(withDelete: boolean = false) {
    if (!NativeHandlers.Audio) {
      return;
    }
    const { isStarting, status } = this.state.getLatestValue();
    if (isStarting) {
      this.pendingStopRequestIds.add(this.startRequestId);
      this.reset();
      return;
    }
    if (status !== 'recording') {
      if (withDelete) {
        this.reset();
      }
      return;
    }
    try {
      await NativeHandlers.Audio.stopRecording();
    } catch {
      // Best effort cleanup, native implementation may already be stopped.
    }

    if (withDelete) {
      this.reset();
    } else {
      this.state.partialNext({ isStarting: false, status: 'stopped' });
    }
  }

  set micLocked(value: boolean) {
    this.state.partialNext({ micLocked: value });
  }

  set status(value: RecordingStatusStates) {
    this.state.partialNext({ status: value });
  }
}
