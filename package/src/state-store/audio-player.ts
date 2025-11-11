import { StateStore } from 'stream-chat';

import { NativeHandlers, SoundReturnType } from '../native';

export type AudioDescriptor = {
  id: string;
  uri: string;
  duration: number;
  mimeType: string;
};

export type AudioPlayerState = {
  isPlaying: boolean;
  duration: number;
  position: number;
  progress: number;
  currentPlaybackRate: number;
  playbackRates: number[];
};

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

const INITIAL_STATE: AudioPlayerState = {
  currentPlaybackRate: 1.0,
  duration: 0,
  isPlaying: false,
  playbackRates: DEFAULT_PLAYBACK_RATES,
  position: 0,
  progress: 0,
};

export type AudioPlayerOptions = AudioDescriptor & {
  playbackRates?: number[];
  playerRef: React.RefObject<SoundReturnType | null> | null;
};

export class AudioPlayer {
  state: StateStore<AudioPlayerState>;
  playerRef: React.RefObject<SoundReturnType | null> | null;
  private _id: string;
  private isExpoCLI: boolean;

  constructor(options: AudioPlayerOptions) {
    this._id = options.id;
    const playbackRates = options.playbackRates ?? DEFAULT_PLAYBACK_RATES;
    this.state = new StateStore<AudioPlayerState>({
      ...INITIAL_STATE,
      currentPlaybackRate: playbackRates[0],
      playbackRates,
    });
    this.playerRef = options.playerRef;
    this.isExpoCLI = NativeHandlers.SDK === 'stream-chat-expo';
  }

  get isPlaying() {
    return this.state.getLatestValue().isPlaying;
  }

  get duration() {
    return this.state.getLatestValue().duration;
  }

  get position() {
    return this.state.getLatestValue().position;
  }

  get progress() {
    return this.state.getLatestValue().progress;
  }

  get playbackRates() {
    return this.state.getLatestValue().playbackRates;
  }

  get currentPlaybackRate() {
    return this.state.getLatestValue().currentPlaybackRate;
  }

  get id() {
    return this._id;
  }

  set duration(duration: number) {
    this.state.partialNext({
      duration,
    });
  }

  set position(position: number) {
    this.state.partialNext({
      position,
      progress: position / this.duration,
    });
  }

  set progress(progress: number) {
    this.state.partialNext({
      position: progress * this.duration,
      progress,
    });
  }

  set isPlaying(isPlaying: boolean) {
    this.state.partialNext({
      isPlaying,
    });
  }

  async changePlaybackRate() {
    let currentPlaybackRateIndex = this.state
      .getLatestValue()
      .playbackRates.indexOf(this.currentPlaybackRate);
    if (currentPlaybackRateIndex === -1) {
      currentPlaybackRateIndex = 0;
    }
    const nextPlayBackIndex =
      currentPlaybackRateIndex === this.playbackRates.length - 1 ? 0 : currentPlaybackRateIndex + 1;
    const nextPlaybackRate = this.playbackRates[nextPlayBackIndex];
    this.state.partialNext({
      currentPlaybackRate: nextPlaybackRate,
    });
    if (!this.playerRef) {
      return;
    }
    if (this.playerRef.current?.setRateAsync) {
      await this.playerRef.current.setRateAsync(nextPlaybackRate, true, 'high');
    }
  }

  _playInternal() {
    if (this.isPlaying || !this.playerRef) {
      return;
    }
    if (this.isExpoCLI) {
      if (this.playerRef.current?.playAsync) {
        this.playerRef.current.playAsync();
      }
    } else {
      if (this.playerRef.current?.resume) {
        this.playerRef.current.resume();
      }
    }
    this.state.partialNext({
      isPlaying: true,
    });
  }

  _pauseInternal() {
    if (!this.isPlaying || !this.playerRef) {
      return;
    }
    if (this.isExpoCLI) {
      if (this.playerRef.current?.pauseAsync) {
        this.playerRef.current.pauseAsync();
      }
    } else {
      if (this.playerRef.current?.pause) {
        this.playerRef.current.pause();
      }
    }
    this.state.partialNext({
      isPlaying: false,
    });
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this._pauseInternal();
    } else {
      this._playInternal();
    }
  }

  async seek(positionInSeconds: number) {
    if (!this.playerRef) {
      return;
    }
    if (this.isExpoCLI) {
      if (positionInSeconds === 0) {
        // If currentTime is 0, we should replay the video from 0th position.
        if (this.playerRef.current?.replayAsync) {
          await this.playerRef.current.replayAsync({});
        }
      } else {
        if (this.playerRef.current?.setPositionAsync) {
          await this.playerRef.current.setPositionAsync(positionInSeconds);
        }
      }
    } else {
      if (this.playerRef.current?.seek) {
        this.playerRef.current.seek(positionInSeconds);
      }
    }
    this.position = positionInSeconds;
  }

  async stop() {
    // First seek to 0 to stop the audio and then pause it
    await this.seek(0);
    this._pauseInternal();
  }

  onRemove() {
    this.playerRef = null;
    this.state.partialNext({
      ...INITIAL_STATE,
      currentPlaybackRate: this.playbackRates[0],
      playbackRates: DEFAULT_PLAYBACK_RATES,
    });
  }
}
