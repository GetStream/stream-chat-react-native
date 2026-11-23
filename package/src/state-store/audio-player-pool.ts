import { StateStore } from '@stream-io/state-store';

import { AudioPlayer, AudioPlayerOptions } from './audio-player';

export type AudioPlayerPoolOptions = {
  allowConcurrentAudioPlayback: boolean;
  /**
   * Called when a player's playback first advances. Returns whether the start was handled; an
   * unhandled start is reported again on the player's next progress.
   */
  onPlaybackStarted?: (player: AudioPlayer) => boolean;
};

export type AudioPlayerPoolState = {
  activeAudioPlayer: AudioPlayer | null;
};

export class AudioPlayerPool {
  pool: Map<string, AudioPlayer>;
  allowConcurrentAudioPlayback: boolean;
  state: StateStore<AudioPlayerPoolState> = new StateStore<AudioPlayerPoolState>({
    activeAudioPlayer: null,
  });

  private onPlaybackStarted?: (player: AudioPlayer) => boolean;

  constructor({ allowConcurrentAudioPlayback, onPlaybackStarted }: AudioPlayerPoolOptions) {
    this.pool = new Map<string, AudioPlayer>();
    this.allowConcurrentAudioPlayback = allowConcurrentAudioPlayback ?? false;
    this.onPlaybackStarted = onPlaybackStarted;
  }

  get players() {
    return Array.from(this.pool.values());
  }

  getOrAddPlayer(params: AudioPlayerOptions) {
    const player = this.pool.get(params.id);
    if (player) {
      player.setOnError(params.onError);
      return player;
    }
    const newPlayer = new AudioPlayer(params);
    newPlayer.pool = this;

    this.pool.set(params.id, newPlayer);
    return newPlayer;
  }

  setActivePlayer(activeAudioPlayer: AudioPlayer | null) {
    this.state.partialNext({
      activeAudioPlayer,
    });
  }

  getActivePlayer() {
    return this.state.getLatestValue().activeAudioPlayer;
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
    if (this.allowConcurrentAudioPlayback) return;

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

  notifyPlaybackStarted(player: AudioPlayer) {
    return this.onPlaybackStarted?.(player) ?? true;
  }
}
