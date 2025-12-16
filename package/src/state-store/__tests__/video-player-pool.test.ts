import { VideoPlayer, VideoPlayerOptions } from '../video-player';
import { VideoPlayerPool } from '../video-player-pool';

// Mock the VideoPlayer class
jest.mock('../video-player', () => ({
  VideoPlayer: jest.fn().mockImplementation((options: VideoPlayerOptions) => ({
    id: options.id,
    isPlaying: false,
    onRemove: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
  })),
}));

const createMockPlayer = (id: string, overrides: Partial<VideoPlayer> = {}): VideoPlayer =>
  ({
    id,
    isPlaying: false,
    onRemove: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    ...overrides,
  }) as unknown as VideoPlayer;

describe('VideoPlayerPool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with an empty pool', () => {
      const pool = new VideoPlayerPool();

      expect(pool.pool.size).toBe(0);
      expect(pool.players).toEqual([]);
    });

    it('should initialize state with null activeVideoPlayer', () => {
      const pool = new VideoPlayerPool();
      const state = pool.state.getLatestValue();

      expect(state.activeVideoPlayer).toBeNull();
    });
  });

  describe('players getter', () => {
    it('should return an empty array when pool is empty', () => {
      const pool = new VideoPlayerPool();

      expect(pool.players).toEqual([]);
    });

    it('should return all players as an array', () => {
      const pool = new VideoPlayerPool();

      pool.getOrAddPlayer({ id: 'player-1' });
      pool.getOrAddPlayer({ id: 'player-2' });
      pool.getOrAddPlayer({ id: 'player-3' });

      expect(pool.players).toHaveLength(3);
    });
  });

  describe('getOrAddPlayer', () => {
    it('should create a new player when id does not exist', () => {
      const pool = new VideoPlayerPool();
      const options: VideoPlayerOptions = { id: 'new-player' };

      const player = pool.getOrAddPlayer(options);

      expect(VideoPlayer).toHaveBeenCalledWith(options);
      expect(pool.pool.has('new-player')).toBe(true);
      expect(player.id).toBe('new-player');
    });

    it('should return existing player when id already exists', () => {
      const pool = new VideoPlayerPool();
      const options: VideoPlayerOptions = { id: 'existing-player' };

      const firstPlayer = pool.getOrAddPlayer(options);
      const secondPlayer = pool.getOrAddPlayer(options);

      expect(VideoPlayer).toHaveBeenCalledTimes(1);
      expect(firstPlayer).toBe(secondPlayer);
    });

    it('should set pool reference on new player', () => {
      const pool = new VideoPlayerPool();
      const options: VideoPlayerOptions = { id: 'player-with-pool' };

      const player = pool.getOrAddPlayer(options);

      expect(player.pool).toBe(pool);
    });

    it('should pass autoPlay option to VideoPlayer', () => {
      const pool = new VideoPlayerPool();
      const options: VideoPlayerOptions = { autoPlay: true, id: 'autoplay-player' };

      pool.getOrAddPlayer(options);

      expect(VideoPlayer).toHaveBeenCalledWith(options);
    });
  });

  describe('setActivePlayer', () => {
    it('should set the active video player', () => {
      const pool = new VideoPlayerPool();
      const mockPlayer = createMockPlayer('active-player');

      pool.setActivePlayer(mockPlayer);

      expect(pool.state.getLatestValue().activeVideoPlayer).toBe(mockPlayer);
    });

    it('should allow setting active player to null', () => {
      const pool = new VideoPlayerPool();
      const mockPlayer = createMockPlayer('active-player');

      pool.setActivePlayer(mockPlayer);
      pool.setActivePlayer(null);

      expect(pool.state.getLatestValue().activeVideoPlayer).toBeNull();
    });
  });

  describe('getActivePlayer', () => {
    it('should return null when no active player is set', () => {
      const pool = new VideoPlayerPool();

      expect(pool.getActivePlayer()).toBeNull();
    });

    it('should return the current active player', () => {
      const pool = new VideoPlayerPool();
      const mockPlayer = createMockPlayer('active-player');

      pool.setActivePlayer(mockPlayer);

      expect(pool.getActivePlayer()).toBe(mockPlayer);
    });
  });

  describe('removePlayer', () => {
    it('should do nothing when player does not exist', () => {
      const pool = new VideoPlayerPool();

      // Should not throw
      pool.removePlayer('non-existent-player');

      expect(pool.pool.size).toBe(0);
    });

    it('should remove player from pool', () => {
      const pool = new VideoPlayerPool();
      pool.getOrAddPlayer({ id: 'player-to-remove' });

      expect(pool.pool.has('player-to-remove')).toBe(true);

      pool.removePlayer('player-to-remove');

      expect(pool.pool.has('player-to-remove')).toBe(false);
    });

    it('should call onRemove on the player being removed', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'player-to-remove' });

      pool.removePlayer('player-to-remove');

      expect(player.onRemove).toHaveBeenCalled();
    });

    it('should set active player to null if removed player was active', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'active-player' });

      pool.setActivePlayer(player as unknown as VideoPlayer);
      expect(pool.getActivePlayer()).toBe(player);

      pool.removePlayer('active-player');

      expect(pool.getActivePlayer()).toBeNull();
    });

    it('should not affect active player if removed player was not active', () => {
      const pool = new VideoPlayerPool();
      const activePlayer = pool.getOrAddPlayer({ id: 'active-player' });
      pool.getOrAddPlayer({ id: 'other-player' });

      pool.setActivePlayer(activePlayer as unknown as VideoPlayer);
      pool.removePlayer('other-player');

      expect(pool.getActivePlayer()).toBe(activePlayer);
    });
  });

  describe('deregister', () => {
    it('should do nothing when player does not exist', () => {
      const pool = new VideoPlayerPool();

      // Should not throw
      pool.deregister('non-existent-player');

      expect(pool.pool.size).toBe(0);
    });

    it('should remove player from pool without calling onRemove', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'player-to-deregister' });

      pool.deregister('player-to-deregister');

      expect(pool.pool.has('player-to-deregister')).toBe(false);
      expect(player.onRemove).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should do nothing when pool is empty', () => {
      const pool = new VideoPlayerPool();

      // Should not throw
      pool.clear();

      expect(pool.pool.size).toBe(0);
      expect(pool.getActivePlayer()).toBeNull();
    });

    it('should remove all players from pool', () => {
      const pool = new VideoPlayerPool();
      pool.getOrAddPlayer({ id: 'player-1' });
      pool.getOrAddPlayer({ id: 'player-2' });
      pool.getOrAddPlayer({ id: 'player-3' });

      expect(pool.pool.size).toBe(3);

      pool.clear();

      expect(pool.pool.size).toBe(0);
    });

    it('should call onRemove on all players', () => {
      const pool = new VideoPlayerPool();
      const player1 = pool.getOrAddPlayer({ id: 'player-1' });
      const player2 = pool.getOrAddPlayer({ id: 'player-2' });

      pool.clear();

      expect(player1.onRemove).toHaveBeenCalled();
      expect(player2.onRemove).toHaveBeenCalled();
    });

    it('should set active player to null', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'active-player' });

      pool.setActivePlayer(player as unknown as VideoPlayer);
      expect(pool.getActivePlayer()).toBe(player);

      pool.clear();

      expect(pool.getActivePlayer()).toBeNull();
    });
  });

  describe('requestPlay', () => {
    it('should set active player when player exists in pool', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'player-1' });

      pool.requestPlay('player-1');

      expect(pool.getActivePlayer()).toBe(player);
    });

    it('should not change active player when player does not exist', () => {
      const pool = new VideoPlayerPool();
      const existingPlayer = pool.getOrAddPlayer({ id: 'existing-player' });
      pool.setActivePlayer(existingPlayer as unknown as VideoPlayer);

      pool.requestPlay('non-existent-player');

      expect(pool.getActivePlayer()).toBe(existingPlayer);
    });

    it('should pause current active player if it is playing and different from requested', () => {
      const pool = new VideoPlayerPool();
      const currentPlayer = createMockPlayer('current-player', { isPlaying: true });
      pool.pool.set('current-player', currentPlayer);
      pool.pool.set('new-player', createMockPlayer('new-player'));

      pool.setActivePlayer(currentPlayer);
      pool.requestPlay('new-player');

      expect(currentPlayer.pause).toHaveBeenCalled();
    });

    it('should not pause current player if it is not playing', () => {
      const pool = new VideoPlayerPool();
      const currentPlayer = createMockPlayer('current-player', { isPlaying: false });
      pool.pool.set('current-player', currentPlayer);
      pool.pool.set('new-player', createMockPlayer('new-player'));

      pool.setActivePlayer(currentPlayer);
      pool.requestPlay('new-player');

      expect(currentPlayer.pause).not.toHaveBeenCalled();
    });

    it('should not pause current player if it is the same as requested', () => {
      const pool = new VideoPlayerPool();
      const currentPlayer = createMockPlayer('same-player', { isPlaying: true });
      pool.pool.set('same-player', currentPlayer);

      pool.setActivePlayer(currentPlayer);
      pool.requestPlay('same-player');

      expect(currentPlayer.pause).not.toHaveBeenCalled();
    });

    it('should handle case when there is no current active player', () => {
      const pool = new VideoPlayerPool();
      const newPlayer = pool.getOrAddPlayer({ id: 'new-player' });

      expect(pool.getActivePlayer()).toBeNull();

      pool.requestPlay('new-player');

      expect(pool.getActivePlayer()).toBe(newPlayer);
    });
  });

  describe('notifyPaused', () => {
    it('should set active player to null', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'active-player' });

      pool.setActivePlayer(player as unknown as VideoPlayer);
      expect(pool.getActivePlayer()).toBe(player);

      pool.notifyPaused();

      expect(pool.getActivePlayer()).toBeNull();
    });

    it('should work even when there is no active player', () => {
      const pool = new VideoPlayerPool();

      expect(pool.getActivePlayer()).toBeNull();

      // Should not throw
      pool.notifyPaused();

      expect(pool.getActivePlayer()).toBeNull();
    });
  });

  describe('state reactivity', () => {
    it('should notify subscribers when active player changes', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'player-1' });
      const callback = jest.fn();

      pool.state.subscribeWithSelector(
        (state) => ({
          activeVideoPlayer: state.activeVideoPlayer,
        }),
        ({ activeVideoPlayer }) => callback(activeVideoPlayer),
      );

      pool.setActivePlayer(player as unknown as VideoPlayer);

      expect(callback).toHaveBeenCalledWith(player);
    });

    it('should notify subscribers when active player is cleared', () => {
      const pool = new VideoPlayerPool();
      const player = pool.getOrAddPlayer({ id: 'player-1' });
      pool.setActivePlayer(player as unknown as VideoPlayer);

      const callback = jest.fn();
      pool.state.subscribeWithSelector(
        (state) => ({
          activeVideoPlayer: state.activeVideoPlayer,
        }),
        ({ activeVideoPlayer }) => callback(activeVideoPlayer),
      );

      pool.notifyPaused();

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple sequential play requests', () => {
      const pool = new VideoPlayerPool();
      const player1 = createMockPlayer('player-1', { isPlaying: true });
      const player2 = createMockPlayer('player-2', { isPlaying: false });
      const player3 = createMockPlayer('player-3', { isPlaying: false });

      pool.pool.set('player-1', player1);
      pool.pool.set('player-2', player2);
      pool.pool.set('player-3', player3);

      pool.setActivePlayer(player1);
      pool.requestPlay('player-2');
      // After switching, player2 is now active. Update mock to reflect playing state
      (player2 as { isPlaying: boolean }).isPlaying = true;
      pool.requestPlay('player-3');

      expect(player1.pause).toHaveBeenCalled();
      expect(player2.pause).toHaveBeenCalled();
      expect(pool.getActivePlayer()).toBe(player3);
    });

    it('should handle removing all players one by one', () => {
      const pool = new VideoPlayerPool();
      const player1 = pool.getOrAddPlayer({ id: 'player-1' });
      pool.getOrAddPlayer({ id: 'player-2' });

      pool.setActivePlayer(player1 as unknown as VideoPlayer);

      pool.removePlayer('player-1');
      expect(pool.getActivePlayer()).toBeNull();
      expect(pool.pool.size).toBe(1);

      pool.removePlayer('player-2');
      expect(pool.pool.size).toBe(0);
    });

    it('should handle adding player with same id after removal', () => {
      const pool = new VideoPlayerPool();

      const originalPlayer = pool.getOrAddPlayer({ id: 'reusable-id' });
      pool.removePlayer('reusable-id');

      const newPlayer = pool.getOrAddPlayer({ id: 'reusable-id' });

      expect(newPlayer).not.toBe(originalPlayer);
      expect(pool.pool.has('reusable-id')).toBe(true);
    });
  });
});
