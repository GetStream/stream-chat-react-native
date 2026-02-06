import { AudioRecorderManagerState } from '../../../state-store/audio-recorder-manager';

export const idleRecordingStateSelector = (state: AudioRecorderManagerState) => ({
  isRecordingStateIdle: state.status === 'idle',
});

export const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  micLocked: state.micLocked,
  isRecordingStateIdle: state.status === 'idle',
  recordingStatus: state.status,
});
