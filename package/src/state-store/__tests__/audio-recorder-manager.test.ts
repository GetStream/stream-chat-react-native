import { AudioReturnType, NativeHandlers } from '../../native';
import { AudioRecorderManager } from '../audio-recorder-manager';

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};

const getMockRecording = () =>
  ({
    getStatusAsync: jest.fn(),
    getURI: jest.fn(),
    pauseAsync: jest.fn(),
    recording: 'recording-id',
    setProgressUpdateInterval: jest.fn(),
    stopAndUnloadAsync: jest.fn(),
  }) as const;

describe('AudioRecorderManager race conditions', () => {
  const originalAudioHandler = NativeHandlers.Audio;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    NativeHandlers.Audio = originalAudioHandler;
  });

  it('keeps initial recorder state', () => {
    const manager = new AudioRecorderManager();
    expect(manager.state.getLatestValue()).toEqual({
      duration: 0,
      isStarting: false,
      micLocked: false,
      recording: undefined,
      status: 'idle',
      waveformData: [],
    });
  });

  it('starts successfully and transitions to recording only after native start resolves', async () => {
    const recording = getMockRecording();
    const startRecording = jest.fn().mockResolvedValue({
      accessGranted: true,
      recording,
    } satisfies AudioReturnType);
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    const startPromise = manager.startRecording();

    expect(manager.state.getLatestValue().isStarting).toBe(true);
    await startPromise;

    const latest = manager.state.getLatestValue();
    expect(latest.isStarting).toBe(false);
    expect(latest.status).toBe('recording');
    expect(latest.recording).toBe(recording);
    expect(recording.setProgressUpdateInterval).toHaveBeenCalledWith(expect.any(Number));
  });

  it('stops during in-flight start and does not enter recording when start resolves', async () => {
    const recording = getMockRecording();
    const deferred = createDeferred<AudioReturnType>();
    const startRecording = jest.fn().mockImplementation(() => deferred.promise);
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    const startPromise = manager.startRecording();

    expect(manager.state.getLatestValue().isStarting).toBe(true);

    await manager.stopRecording();
    expect(manager.state.getLatestValue()).toEqual({
      duration: 0,
      isStarting: false,
      micLocked: false,
      recording: undefined,
      status: 'idle',
      waveformData: [],
    });

    deferred.resolve({ accessGranted: true, recording });
    await startPromise;

    expect(stopRecording).toHaveBeenCalledTimes(1);
    expect(manager.state.getLatestValue().status).toBe('idle');
    expect(manager.state.getLatestValue().recording).toBeUndefined();
  });

  it('does not call native stop after pending stop if start resolves without access', async () => {
    const deferred = createDeferred<AudioReturnType>();
    const startRecording = jest.fn().mockImplementation(() => deferred.promise);
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    const startPromise = manager.startRecording();
    await manager.stopRecording();

    deferred.resolve({ accessGranted: false, recording: undefined });
    await startPromise;

    expect(stopRecording).not.toHaveBeenCalled();
    expect(manager.state.getLatestValue().status).toBe('idle');
  });

  it('resets state when native start throws', async () => {
    const startRecording = jest.fn().mockRejectedValue(new Error('start failed'));
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    const result = await manager.startRecording();

    expect(result).toBe(false);
    expect(manager.state.getLatestValue()).toEqual({
      duration: 0,
      isStarting: false,
      micLocked: false,
      recording: undefined,
      status: 'idle',
      waveformData: [],
    });
  });

  it('does not let stale start completion overwrite newer recording session', async () => {
    const recording1 = getMockRecording();
    const recording2 = getMockRecording();
    const deferred1 = createDeferred<AudioReturnType>();
    const deferred2 = createDeferred<AudioReturnType>();

    const startRecording = jest
      .fn()
      .mockImplementationOnce(() => deferred1.promise)
      .mockImplementationOnce(() => deferred2.promise);
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    const firstStart = manager.startRecording();
    await manager.stopRecording();
    const secondStart = manager.startRecording();

    deferred1.resolve({ accessGranted: true, recording: recording1 });
    await firstStart;

    // First (stale) completion should not put stale recording into state.
    expect(manager.state.getLatestValue().recording).toBeUndefined();
    expect(manager.state.getLatestValue().status).toBe('idle');

    deferred2.resolve({ accessGranted: true, recording: recording2 });
    await secondStart;

    expect(manager.state.getLatestValue().recording).toBe(recording2);
    expect(manager.state.getLatestValue().status).toBe('recording');
  });

  it('stopRecording with delete clears state instead of setting stopped', async () => {
    const recording = getMockRecording();
    const startRecording = jest.fn().mockResolvedValue({
      accessGranted: true,
      recording,
    } satisfies AudioReturnType);
    const stopRecording = jest.fn().mockResolvedValue(undefined);

    NativeHandlers.Audio = {
      audioRecordingConfiguration: {},
      startRecording,
      stopRecording,
    };

    const manager = new AudioRecorderManager();
    await manager.startRecording();
    await manager.stopRecording(true);

    expect(manager.state.getLatestValue()).toEqual({
      duration: 0,
      isStarting: false,
      micLocked: false,
      recording: undefined,
      status: 'idle',
      waveformData: [],
    });
  });
});
