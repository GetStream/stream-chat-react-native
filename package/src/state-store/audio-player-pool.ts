import { AudioPlayer, AudioPlayerOptions } from './audio-player';

export type AudioPlayerPoolOptions = {
  allowConcurrentAudioPlayback: boolean;
};

export class AudioPlayerPool {
  pool: Map<string, AudioPlayer>;
  allowConcurrentAudioPlayback: boolean;
  private currentlyPlayingId: string | null = null;

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

  removePlayer(id: string) {
    const player = this.pool.get(id);
    if (!player) return;
    player.onRemove();
    this.pool.delete(id);

    // Clear tracking if this was the currently playing player
    if (!this.allowConcurrentAudioPlayback && this.currentlyPlayingId === id) {
      this.currentlyPlayingId = null;
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
    this.currentlyPlayingId = null;
  }

  requestPlay(id: string) {
    if (this.allowConcurrentAudioPlayback) return;

    if (this.currentlyPlayingId && this.currentlyPlayingId !== id) {
      const currentPlayer = this.pool.get(this.currentlyPlayingId);
      if (currentPlayer && currentPlayer.isPlaying) {
        currentPlayer.pause();
      }
    }
    this.currentlyPlayingId = id;
  }

  notifyPaused(id: string) {
    if (this.currentlyPlayingId === id) {
      this.currentlyPlayingId = null;
    }
  }
}
