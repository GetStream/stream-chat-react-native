import { StateStore } from 'stream-chat';

import { VideoPlayer, VideoPlayerOptions } from './video-player';

export type VideoPlayerPoolState = {
  activeVideoPlayer: VideoPlayer | null;
};

export class VideoPlayerPool {
  pool: Map<string, VideoPlayer>;
  state: StateStore<VideoPlayerPoolState> = new StateStore<VideoPlayerPoolState>({
    activeVideoPlayer: null,
  });

  constructor() {
    this.pool = new Map<string, VideoPlayer>();
  }

  get players() {
    return Array.from(this.pool.values());
  }

  getOrAddPlayer(params: VideoPlayerOptions) {
    const player = this.pool.get(params.id);
    if (player) {
      return player;
    }
    const newPlayer = new VideoPlayer(params);
    newPlayer.pool = this;

    this.pool.set(params.id, newPlayer);
    return newPlayer;
  }

  setActivePlayer(activeVideoPlayer: VideoPlayer | null) {
    this.state.partialNext({
      activeVideoPlayer,
    });
  }

  getActivePlayer() {
    return this.state.getLatestValue().activeVideoPlayer;
  }

  removePlayer(id: string) {
    const player = this.pool.get(id);
    if (!player) return;
    player.onRemove();
    this.pool.delete(id);

    if (this.getActivePlayer()?.id === id) {
      this.setActivePlayer(null);
    }
  }

  deregister(id: string) {
    if (this.pool.has(id)) {
      this.pool.delete(id);
    }
  }

  clear() {
    for (const player of this.pool.values()) {
      this.removePlayer(player.id);
    }
    this.setActivePlayer(null);
  }

  requestPlay(id: string) {
    if (this.getActivePlayer()?.id !== id) {
      const currentPlayer = this.getActivePlayer();
      if (currentPlayer && currentPlayer.isPlaying) {
        currentPlayer.pause();
      }
    }

    const activePlayer = this.pool.get(id);
    if (activePlayer) {
      this.setActivePlayer(activePlayer);
    }
  }

  notifyPaused() {
    this.setActivePlayer(null);
  }
}
