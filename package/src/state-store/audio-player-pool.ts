import { AudioPlayer, AudioPlayerOptions } from './audio-player';

export type AudioPlayerPoolOptions = {
  multipleAudioPlayers: boolean;
};

export class AudioPlayerPool {
  audioPlayers: Map<string, AudioPlayer>;
  multipleAudioPlayers: boolean;
  constructor({ multipleAudioPlayers }: AudioPlayerPoolOptions) {
    this.audioPlayers = new Map<string, AudioPlayer>();
    this.multipleAudioPlayers = multipleAudioPlayers ?? false;
  }

  getPlayers() {
    return Array.from(this.audioPlayers.values());
  }

  getOrAddPlayer(params: AudioPlayerOptions) {
    const player = this.audioPlayers.get(params.id);
    if (player) {
      return player;
    }
    const newPlayer = new AudioPlayer(params);

    this.audioPlayers.set(params.id, newPlayer);
    return newPlayer;
  }

  removePlayer(id: string) {
    const player = this.audioPlayers.get(id);
    if (!player) return;
    player.onRemove();
    this.audioPlayers.delete(id);
  }

  clear() {
    for (const player of this.audioPlayers.values()) {
      this.removePlayer(player.id);
    }
  }

  play(id: string) {
    const targetPlayer = this.audioPlayers.get(id);
    if (!targetPlayer) return;

    if (!this.multipleAudioPlayers) {
      for (const [playerId, player] of this.audioPlayers) {
        if (playerId !== id && player.isPlaying) {
          // eslint-disable-next-line no-underscore-dangle
          player._pauseInternal();
        }
      }
    }
    // eslint-disable-next-line no-underscore-dangle
    targetPlayer._playInternal();
  }

  pause(id: string) {
    const targetPlayer = this.audioPlayers.get(id);
    if (!targetPlayer) return;
    // eslint-disable-next-line no-underscore-dangle
    targetPlayer._pauseInternal();
  }

  toggle(id: string) {
    const targetPlayer = this.audioPlayers.get(id);
    if (!targetPlayer) return;
    if (targetPlayer.isPlaying) {
      this.pause(id);
    } else {
      this.play(id);
    }
  }
}
