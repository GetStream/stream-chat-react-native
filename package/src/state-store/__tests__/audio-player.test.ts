import { NativeHandlers } from '../../native';
import { AudioPlayer } from '../audio-player';

jest.mock('../../native', () => ({
  NativeHandlers: {
    Audio: undefined,
    SDK: '',
    Sound: undefined,
  },
}));

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createMockNativePlayerRef = () => ({
  pause: jest.fn(),
  resume: jest.fn(),
  seek: jest.fn(),
  setRateAsync: jest.fn(),
  stopAsync: jest.fn(),
  unloadAsync: jest.fn(),
});

const createMockExpoPlayerRef = () => ({
  pauseAsync: jest.fn(),
  playAsync: jest.fn(),
  replayAsync: jest.fn(),
  setPositionAsync: jest.fn(),
  stopAsync: jest.fn(),
  unloadAsync: jest.fn(),
});

const getLoadedPlaybackStatus = ({
  didJustFinish = false,
  durationMillis = 30000,
  isPlaying = true,
  positionMillis = 5000,
} = {}) => ({
  currentPosition: positionMillis,
  didJustFinish,
  duration: durationMillis,
  durationMillis,
  error: null,
  isBuffering: false,
  isLoaded: true,
  isLooping: false,
  isMuted: false,
  isPlaying,
  isSeeking: false,
  positionMillis,
  shouldPlay: isPlaying,
});

describe('AudioPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NativeHandlers as { SDK: string }).SDK = 'stream-chat-react-native';
    (NativeHandlers as { Sound: unknown }).Sound = undefined;
  });

  it('initializes native playback through Sound.initializeSound', async () => {
    const playerRef = createMockNativePlayerRef();
    const initializeSound = jest.fn().mockResolvedValue(playerRef);
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound,
    };

    const player = new AudioPlayer({
      duration: 30,
      id: 'native-audio-player',
      mimeType: 'audio/mp4',
      type: 'audio',
      uri: 'https://example.com/audio.mp4',
    });

    await flushPromises();

    expect(initializeSound).toHaveBeenCalledWith(
      { uri: 'https://example.com/audio.mp4' },
      expect.objectContaining({ progressUpdateIntervalMillis: 100 }),
      expect.any(Function),
    );

    player.play();

    expect(playerRef.resume).toHaveBeenCalledTimes(1);
  });

  it('stores native seek position in milliseconds while seeking the player in seconds', async () => {
    const playerRef = createMockNativePlayerRef();
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound: jest.fn().mockResolvedValue(playerRef),
    };

    const player = new AudioPlayer({
      duration: 30,
      id: 'audio-player',
      mimeType: 'audio/aac',
      type: 'audio',
      uri: 'https://example.com/audio.aac',
    });

    await flushPromises();
    await player.seek(5);

    expect(player.position).toBe(5000);
    expect(player.progress).toBeCloseTo(5000 / 30000);
    expect(playerRef.seek).toHaveBeenCalledWith(5);
  });

  it('passes milliseconds to expo setPositionAsync', async () => {
    (NativeHandlers as { SDK: string }).SDK = 'stream-chat-expo';

    const playerRef = createMockExpoPlayerRef();
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound: jest.fn().mockResolvedValue(playerRef),
    };

    const player = new AudioPlayer({
      duration: 30,
      id: 'expo-audio-player',
      mimeType: 'audio/aac',
      type: 'audio',
      uri: 'https://example.com/audio.aac',
    });

    await flushPromises();
    await player.seek(5);

    expect(player.position).toBe(5000);
    expect(playerRef.setPositionAsync).toHaveBeenCalledWith(5000);
  });

  it('unloads the native player on remove', async () => {
    const playerRef = createMockNativePlayerRef();
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound: jest.fn().mockResolvedValue(playerRef),
    };

    const player = new AudioPlayer({
      duration: 30,
      id: 'remove-audio-player',
      mimeType: 'audio/mp4',
      type: 'audio',
      uri: 'https://example.com/audio.mp4',
    });

    await flushPromises();
    player.onRemove();

    expect(playerRef.stopAsync).toHaveBeenCalledTimes(1);
    expect(playerRef.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it('cleans up a stale native player when initialization resolves after removal', async () => {
    const playerRef = createMockNativePlayerRef();
    let resolveInitializeSound: (player: typeof playerRef) => void;
    const initializeSound = jest.fn(
      () =>
        new Promise<typeof playerRef>((resolve) => {
          resolveInitializeSound = resolve;
        }),
    );
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound,
    };

    const player = new AudioPlayer({
      duration: 30,
      id: 'stale-audio-player',
      mimeType: 'audio/mp4',
      type: 'audio',
      uri: 'https://example.com/audio.mp4',
    });

    player.onRemove();
    resolveInitializeSound!(playerRef);
    await flushPromises();

    expect(playerRef.stopAsync).toHaveBeenCalledTimes(1);
    expect(playerRef.unloadAsync).toHaveBeenCalledTimes(1);
  });

  it('updates playback state from the native playback callback', async () => {
    const playerRef = createMockNativePlayerRef();
    let onPlaybackStatusUpdate;
    (NativeHandlers as { Sound: unknown }).Sound = {
      Player: null,
      initializeSound: jest.fn().mockImplementation((_source, _initialStatus, callback) => {
        onPlaybackStatusUpdate = callback;
        return playerRef;
      }),
    };

    const player = new AudioPlayer({
      duration: 0,
      id: 'callback-audio-player',
      mimeType: 'audio/mp4',
      type: 'audio',
      uri: 'https://example.com/audio.mp4',
    });

    await flushPromises();
    await onPlaybackStatusUpdate(getLoadedPlaybackStatus());

    expect(player.duration).toBe(30000);
    expect(player.position).toBe(5000);
    expect(player.progress).toBeCloseTo(5000 / 30000);
  });
});
