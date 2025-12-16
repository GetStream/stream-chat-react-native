import { NativeHandlers } from '../../native';
import { ONE_SECOND_IN_MILLISECONDS } from '../../utils/constants';
import { INITIAL_VIDEO_PLAYER_STATE, VideoPlayer, VideoPlayerOptions } from '../video-player';
import { VideoPlayerPool } from '../video-player-pool';

// Mock the native module
jest.mock('../../native', () => ({
  NativeHandlers: {
    SDK: '',
  },
}));

const createMockPlayerRef = () => ({
  pause: jest.fn(),
  play: jest.fn(),
  seek: jest.fn(),
  seekBy: jest.fn(),
});

const createMockPool = (): jest.Mocked<VideoPlayerPool> =>
  ({
    notifyPaused: jest.fn(),
    requestPlay: jest.fn(),
  }) as unknown as jest.Mocked<VideoPlayerPool>;

describe('VideoPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset SDK to default (non-Expo) for most tests
    (NativeHandlers as { SDK: string }).SDK = '';
  });

  describe('INITIAL_VIDEO_PLAYER_STATE', () => {
    it('should have correct initial values', () => {
      expect(INITIAL_VIDEO_PLAYER_STATE).toEqual({
        duration: 0,
        isPlaying: false,
        position: 0,
        progress: 0,
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with default state when no autoPlay option', () => {
      const options: VideoPlayerOptions = { id: 'test-player' };
      const player = new VideoPlayer(options);

      expect(player.id).toBe('test-player');
      expect(player.isPlaying).toBe(false);
      expect(player.duration).toBe(0);
      expect(player.position).toBe(0);
      expect(player.progress).toBe(0);
    });

    it('should initialize with isPlaying=true when autoPlay is true', () => {
      const options: VideoPlayerOptions = { autoPlay: true, id: 'autoplay-player' };
      const player = new VideoPlayer(options);

      expect(player.isPlaying).toBe(true);
    });

    it('should initialize with isPlaying=false when autoPlay is false', () => {
      const options: VideoPlayerOptions = { autoPlay: false, id: 'no-autoplay-player' };
      const player = new VideoPlayer(options);

      expect(player.isPlaying).toBe(false);
    });

    it('should store options', () => {
      const options: VideoPlayerOptions = { autoPlay: true, id: 'options-player' };
      const player = new VideoPlayer(options);

      expect(player.options).toBe(options);
    });

    it('should initialize playerRef as null', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(player.playerRef).toBeNull();
    });

    it('should detect Expo SDK', () => {
      (NativeHandlers as { SDK: string }).SDK = 'stream-chat-expo';
      const player = new VideoPlayer({ id: 'expo-player' });

      // isExpoCLI is private, but we can test its effect through seek behavior
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;
      player.seek(5000);

      // Expo uses seekBy instead of seek
      expect(mockRef.seekBy).toHaveBeenCalled();
      expect(mockRef.seek).not.toHaveBeenCalled();
    });

    it('should detect non-Expo SDK', () => {
      (NativeHandlers as { SDK: string }).SDK = 'stream-chat-react-native';
      const player = new VideoPlayer({ id: 'rn-player' });

      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;
      player.seek(5000);

      // Non-Expo uses seek instead of seekBy
      expect(mockRef.seek).toHaveBeenCalled();
      expect(mockRef.seekBy).not.toHaveBeenCalled();
    });
  });

  describe('initPlayer', () => {
    it('should set playerRef when provided', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();

      player.initPlayer({ playerRef: mockRef as never });

      expect(player.playerRef).toBe(mockRef);
    });

    it('should set playerRef to null when not provided', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();

      player.initPlayer({ playerRef: mockRef as never });
      player.initPlayer({});

      expect(player.playerRef).toBeNull();
    });
  });

  describe('id getter', () => {
    it('should return the player id', () => {
      const player = new VideoPlayer({ id: 'unique-id' });

      expect(player.id).toBe('unique-id');
    });
  });

  describe('isPlaying getter and setter', () => {
    it('should get isPlaying from state', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });

      expect(player.isPlaying).toBe(true);
    });

    it('should set isPlaying in state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.isPlaying = true;

      expect(player.state.getLatestValue().isPlaying).toBe(true);

      player.isPlaying = false;

      expect(player.state.getLatestValue().isPlaying).toBe(false);
    });
  });

  describe('duration getter and setter', () => {
    it('should get duration from state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(player.duration).toBe(0);
    });

    it('should set duration in state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.duration = 5000;

      expect(player.state.getLatestValue().duration).toBe(5000);
      expect(player.duration).toBe(5000);
    });
  });

  describe('position getter and setter', () => {
    it('should get position from state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(player.position).toBe(0);
    });

    it('should set position and calculate progress in state', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      player.position = 5000;

      expect(player.state.getLatestValue().position).toBe(5000);
      expect(player.state.getLatestValue().progress).toBe(0.5);
    });

    it('should handle position when duration is 0', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.position = 5000;

      expect(player.state.getLatestValue().position).toBe(5000);
      expect(player.state.getLatestValue().progress).toBe(Infinity);
    });
  });

  describe('progress getter and setter', () => {
    it('should get progress from state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(player.progress).toBe(0);
    });

    it('should set progress and calculate position in state', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      player.progress = 0.75;

      expect(player.state.getLatestValue().progress).toBe(0.75);
      expect(player.state.getLatestValue().position).toBe(7500);
    });

    it('should handle progress when duration is 0', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.progress = 0.5;

      expect(player.state.getLatestValue().progress).toBe(0.5);
      expect(player.state.getLatestValue().position).toBe(0);
    });
  });

  describe('pool setter', () => {
    it('should set pool reference', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockPool = createMockPool();

      player.pool = mockPool;

      // Test pool is set by checking play() behavior
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.play();

      expect(mockPool.requestPlay).toHaveBeenCalledWith('test-player');
    });
  });

  describe('play', () => {
    it('should call requestPlay on pool when pool is set', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockPool = createMockPool();
      player.pool = mockPool;

      player.play();

      expect(mockPool.requestPlay).toHaveBeenCalledWith('test-player');
    });

    it('should call play on playerRef when available', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.play();

      expect(mockRef.play).toHaveBeenCalled();
    });

    it('should set isPlaying to true in state', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.play();

      expect(player.state.getLatestValue().isPlaying).toBe(true);
    });

    it('should not throw when no pool or playerRef', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(() => player.play()).not.toThrow();
      expect(player.isPlaying).toBe(true);
    });

    it('should not call playerRef.play when play method is undefined', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = { pause: jest.fn() }; // No play method
      player.initPlayer({ playerRef: mockRef as never });

      expect(() => player.play()).not.toThrow();
      expect(player.isPlaying).toBe(true);
    });
  });

  describe('pause', () => {
    it('should call pause on playerRef when available', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.pause();

      expect(mockRef.pause).toHaveBeenCalled();
    });

    it('should set isPlaying to false in state', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });

      player.pause();

      expect(player.state.getLatestValue().isPlaying).toBe(false);
    });

    it('should call notifyPaused on pool when pool is set', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockPool = createMockPool();
      player.pool = mockPool;

      player.pause();

      expect(mockPool.notifyPaused).toHaveBeenCalled();
    });

    it('should not throw when no pool or playerRef', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(() => player.pause()).not.toThrow();
      expect(player.isPlaying).toBe(false);
    });

    it('should not call playerRef.pause when pause method is undefined', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = { play: jest.fn() }; // No pause method
      player.initPlayer({ playerRef: mockRef as never });

      expect(() => player.pause()).not.toThrow();
    });
  });

  describe('toggle', () => {
    it('should call pause when currently playing', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.toggle();

      expect(mockRef.pause).toHaveBeenCalled();
      expect(player.isPlaying).toBe(false);
    });

    it('should call play when currently paused', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.toggle();

      expect(mockRef.play).toHaveBeenCalled();
      expect(player.isPlaying).toBe(true);
    });

    it('should toggle state correctly multiple times', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(player.isPlaying).toBe(false);

      player.toggle();
      expect(player.isPlaying).toBe(true);

      player.toggle();
      expect(player.isPlaying).toBe(false);

      player.toggle();
      expect(player.isPlaying).toBe(true);
    });
  });

  describe('seek', () => {
    it('should update position state', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      player.seek(5000);

      expect(player.position).toBe(5000);
      expect(player.progress).toBe(0.5);
    });

    it('should call seek on playerRef for non-Expo SDK', () => {
      (NativeHandlers as { SDK: string }).SDK = 'stream-chat-react-native';
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;

      player.seek(5000);

      expect(mockRef.seek).toHaveBeenCalledWith(5000 / ONE_SECOND_IN_MILLISECONDS);
      expect(mockRef.seekBy).not.toHaveBeenCalled();
    });

    it('should call seekBy on playerRef for Expo SDK', () => {
      (NativeHandlers as { SDK: string }).SDK = 'stream-chat-expo';
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;

      player.seek(5000);

      expect(mockRef.seekBy).toHaveBeenCalledWith(5000 / ONE_SECOND_IN_MILLISECONDS);
      expect(mockRef.seek).not.toHaveBeenCalled();
    });

    it('should not throw when playerRef has no seek methods', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = {};
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;

      expect(() => player.seek(5000)).not.toThrow();
      expect(player.position).toBe(5000);
    });

    it('should not throw when no playerRef', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      expect(() => player.seek(5000)).not.toThrow();
      expect(player.position).toBe(5000);
    });

    it('should convert milliseconds to seconds correctly', () => {
      (NativeHandlers as { SDK: string }).SDK = 'stream-chat-react-native';
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;

      player.seek(2500);

      expect(mockRef.seek).toHaveBeenCalledWith(2.5);
    });
  });

  describe('stop', () => {
    it('should seek to 0 and pause', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;
      player.position = 5000;

      player.stop();

      expect(player.position).toBe(0);
      expect(player.isPlaying).toBe(false);
      expect(mockRef.pause).toHaveBeenCalled();
    });

    it('should work without playerRef', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      player.duration = 10000;
      player.position = 5000;

      player.stop();

      expect(player.position).toBe(0);
      expect(player.isPlaying).toBe(false);
    });
  });

  describe('onRemove', () => {
    it('should pause playerRef if available', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.onRemove();

      expect(mockRef.pause).toHaveBeenCalled();
    });

    it('should set playerRef to null', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.onRemove();

      expect(player.playerRef).toBeNull();
    });

    it('should reset state to initial values', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      player.duration = 10000;
      player.position = 5000;

      player.onRemove();

      expect(player.state.getLatestValue()).toEqual(INITIAL_VIDEO_PLAYER_STATE);
    });

    it('should not throw when no playerRef', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      expect(() => player.onRemove()).not.toThrow();
    });

    it('should not throw when playerRef has no pause method', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = { play: jest.fn() };
      player.initPlayer({ playerRef: mockRef as never });

      expect(() => player.onRemove()).not.toThrow();
      expect(player.playerRef).toBeNull();
    });
  });

  describe('state reactivity', () => {
    it('should notify subscribers when isPlaying changes', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const callback = jest.fn();

      player.state.subscribeWithSelector(
        (state) => ({ isPlaying: state.isPlaying }),
        ({ isPlaying }) => callback(isPlaying),
      );

      player.play();

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should notify subscribers when duration changes', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const callback = jest.fn();

      player.state.subscribeWithSelector(
        (state) => ({ duration: state.duration }),
        ({ duration }) => callback(duration),
      );

      player.duration = 5000;

      expect(callback).toHaveBeenCalledWith(5000);
    });

    it('should notify subscribers when position changes', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const callback = jest.fn();
      player.duration = 10000;

      player.state.subscribeWithSelector(
        (state) => ({ position: state.position }),
        ({ position }) => callback(position),
      );

      player.position = 2500;

      expect(callback).toHaveBeenCalledWith(2500);
    });

    it('should notify subscribers when progress changes', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const callback = jest.fn();
      player.duration = 10000;

      player.state.subscribeWithSelector(
        (state) => ({ progress: state.progress }),
        ({ progress }) => callback(progress),
      );

      player.progress = 0.5;

      expect(callback).toHaveBeenCalledWith(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle play/pause cycle correctly', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.play();
      expect(player.isPlaying).toBe(true);
      expect(mockRef.play).toHaveBeenCalledTimes(1);

      player.pause();
      expect(player.isPlaying).toBe(false);
      expect(mockRef.pause).toHaveBeenCalledTimes(1);

      player.play();
      expect(player.isPlaying).toBe(true);
      expect(mockRef.play).toHaveBeenCalledTimes(2);
    });

    it('should handle seek during playback', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });
      player.duration = 10000;

      player.seek(7500);

      expect(player.position).toBe(7500);
      expect(player.progress).toBe(0.75);
      expect(player.isPlaying).toBe(true); // Should remain playing
    });

    it('should handle zero duration gracefully', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.position = 1000;
      expect(player.progress).toBe(Infinity);

      player.progress = 0.5;
      expect(player.position).toBe(0); // 0.5 * 0 = 0
    });

    it('should handle negative position values', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      player.position = -1000;

      expect(player.position).toBe(-1000);
      expect(player.progress).toBe(-0.1);
    });

    it('should handle progress values greater than 1', () => {
      const player = new VideoPlayer({ id: 'test-player' });
      player.duration = 10000;

      player.progress = 1.5;

      expect(player.progress).toBe(1.5);
      expect(player.position).toBe(15000);
    });

    it('should handle multiple state updates in sequence', () => {
      const player = new VideoPlayer({ id: 'test-player' });

      player.duration = 10000;
      player.position = 2500;
      player.isPlaying = true;
      player.progress = 0.75;

      const state = player.state.getLatestValue();
      expect(state.duration).toBe(10000);
      expect(state.progress).toBe(0.75);
      expect(state.position).toBe(7500); // progress setter updates position
      expect(state.isPlaying).toBe(true);
    });

    it('should maintain state consistency after onRemove', () => {
      const player = new VideoPlayer({ autoPlay: true, id: 'test-player' });
      player.duration = 10000;
      player.position = 5000;
      const mockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: mockRef as never });

      player.onRemove();

      const state = player.state.getLatestValue();
      expect(state).toEqual(INITIAL_VIDEO_PLAYER_STATE);
      expect(player.playerRef).toBeNull();

      // Should be able to reinitialize
      const newMockRef = createMockPlayerRef();
      player.initPlayer({ playerRef: newMockRef as never });
      expect(player.playerRef).toBe(newMockRef);
    });
  });
});
