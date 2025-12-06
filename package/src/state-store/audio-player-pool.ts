import { StateStore } from 'stream-chat';

import { AudioPlayer, AudioPlayerOptions } from './audio-player';

export type AudioPlayerPoolOptions = {
  allowConcurrentAudioPlayback: boolean;
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

  constructor({ allowConcurrentAudioPlayback }: AudioPlayerPoolOptions) {
    this.pool = new Map<string, AudioPlayer>();
    this.allowConcurrentAudioPlayback = allowConcurrentAudioPlayback ?? false;
  }

  get players() {
    return Array.from(this.pool.values());
  }

  getOrAddPlayer(params: AudioPlayerOptions) {
    const player = this.pool.get(params.id);
    if (player) {
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
}
