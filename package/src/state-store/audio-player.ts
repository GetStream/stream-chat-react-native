import { StateStore } from 'stream-chat';

import { AudioPlayerPool } from './audio-player-pool';

import { AVPlaybackStatusToSet, NativeHandlers, PlaybackStatus, SoundReturnType } from '../native';

export type AudioDescriptor = {
  id: string;
  uri: string;
  duration: number;
  mimeType: string;
  type: 'voiceRecording' | 'audio';
};

export type AudioPlayerErrorCode = 'failed-to-start' | 'not-playable' | 'seek-not-supported';

export type AudioPlayerErrorHandler = (params: {
  errCode: AudioPlayerErrorCode;
  error?: Error;
}) => void;

export type AudioPlayerState = {
  isPlaying: boolean;
  duration: number;
  position: number;
  progress: number;
  currentPlaybackRate: number;
  playbackRates: number[];
};

const DEFAULT_PLAYBACK_RATES = [1.0, 1.5, 2.0];

const DEFAULT_PLAYER_SETTINGS = {
  pitchCorrectionQuality: 'high',
  progressUpdateIntervalMillis: 100,
  shouldCorrectPitch: true,
} as AVPlaybackStatusToSet;

const INITIAL_STATE: AudioPlayerState = {
  currentPlaybackRate: 1.0,
  duration: 0,
  isPlaying: false,
  playbackRates: DEFAULT_PLAYBACK_RATES,
  position: 0,
  progress: 0,
};

export type AudioPlayerOptions = AudioDescriptor & {
  onError?: AudioPlayerErrorHandler;
  playbackRates?: number[];
  previewVoiceRecording?: boolean;
};

export class AudioPlayer {
  state: StateStore<AudioPlayerState>;
  playerRef: SoundReturnType | null = null;
  private initRequestId = 0;
  private _id: string;
  private type: 'voiceRecording' | 'audio';
  private isExpoCLI: boolean;
  private _pool: AudioPlayerPool | null = null;
  private onError?: AudioPlayerErrorHandler;
  private lastPlaybackStatusError?: string;
  private lastSeekNotSupportedNotificationAt?: number;

  /**
   * This keeps the composer preview on the recorder-backed player until preview
   * and attachment playback are fully unified under the same sound service.
   */
  private previewVoiceRecording?: boolean;

  constructor(options: AudioPlayerOptions) {
    this.isExpoCLI = NativeHandlers.SDK === 'stream-chat-expo';
    this._id = options.id;
    this.type = options.type;
    this.onError = options.onError;
    this.previewVoiceRecording = options.previewVoiceRecording ?? false;
    const playbackRates = options.playbackRates ?? DEFAULT_PLAYBACK_RATES;
    this.state = new StateStore<AudioPlayerState>({
      ...INITIAL_STATE,
      currentPlaybackRate: playbackRates[0],
      duration: options.duration * 1000,
      playbackRates,
    });
    this.initPlayer({ uri: options.uri });
  }

  setOnError(onError?: AudioPlayerErrorHandler) {
    this.onError = onError;
  }

  private getError(error: unknown) {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message;
      if (typeof message === 'string') return new Error(message);
    }
    return undefined;
  }

  private notifyError(errCode: AudioPlayerErrorCode, error?: unknown) {
    if (errCode === 'seek-not-supported') {
      const now = Date.now();
      if (
        typeof this.lastSeekNotSupportedNotificationAt === 'number' &&
        now - this.lastSeekNotSupportedNotificationAt < 1000
      ) {
        return;
      }
      this.lastSeekNotSupportedNotificationAt = now;
    }

    this.onError?.({
      errCode,
      error: this.getError(error),
    });
  }

  private handleMaybePromiseError(
    result: unknown,
    errCode: AudioPlayerErrorCode,
    onError?: () => void,
  ) {
    if (!result || typeof (result as Promise<void>).catch !== 'function') return;

    (result as Promise<void>).catch((error) => {
      onError?.();
      this.notifyError(errCode, error);
    });
  }

  initPlayer = async ({ uri, playerRef }: { uri?: string; playerRef?: SoundReturnType }) => {
    const requestId = ++this.initRequestId;

    if (playerRef) {
      if (requestId === this.initRequestId) {
        this.playerRef = playerRef;
      }
      return;
    }
    if (this.previewVoiceRecording) {
      if (NativeHandlers.Audio?.startPlayer) {
        try {
          await NativeHandlers.Audio.startPlayer(
            uri,
            {},
            this.onVoiceRecordingPreviewPlaybackStatusUpdate,
          );
          if (NativeHandlers.Audio?.pausePlayer) {
            await NativeHandlers.Audio.pausePlayer();
          }
        } catch (error) {
          this.notifyError('failed-to-start', error);
        }
      }
      return;
    }
    if (!uri || !NativeHandlers.Sound?.initializeSound) {
      return;
    }

    let player: SoundReturnType | null | undefined;
    try {
      player = await NativeHandlers.Sound.initializeSound(
        { uri },
        DEFAULT_PLAYER_SETTINGS,
        this.onPlaybackStatusUpdate,
      );
    } catch (error) {
      this.notifyError('failed-to-start', error);
      return;
    }

    if (!player) {
      this.notifyError('not-playable');
      return;
    }

    if (requestId !== this.initRequestId) {
      if (player?.stopAsync) {
        player.stopAsync();
      }
      if (player?.unloadAsync) {
        player.unloadAsync();
      }
      return;
    }

    this.playerRef = player;
  };

  private onVoiceRecordingPreviewPlaybackStatusUpdate = async (playbackStatus: PlaybackStatus) => {
    const currentProgress = playbackStatus.currentPosition / playbackStatus.duration;
    if (currentProgress === 1) {
      await this.stop();
    } else {
      this.progress = currentProgress;
    }
  };

  // This should be a arrow function to avoid binding the function to the instance
  private onPlaybackStatusUpdate = async (playbackStatus: PlaybackStatus) => {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        if (this.lastPlaybackStatusError !== playbackStatus.error) {
          this.lastPlaybackStatusError = playbackStatus.error;
          this.notifyError('not-playable', playbackStatus.error);
        }
      }
    } else {
      const { durationMillis, positionMillis } = playbackStatus;
      // Update your UI for the loaded state
      // This is done for Expo CLI where we don't get file duration from file picker

      if (this.type !== 'voiceRecording') {
        this.duration = durationMillis;
      }

      // Update the position of the audio player when it is playing
      if (playbackStatus.isPlaying) {
        // The duration given by the expo-av is not same as the one of the voice recording, so we take the actual duration for voice recording.
        const duration = this.type === 'voiceRecording' ? this.duration : durationMillis;
        if (positionMillis <= duration) {
          this.position = positionMillis;
        }
      }

      // Update the UI when the audio is finished playing
      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        await this.stop();
      }
    }
  };

  // Getters
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

  // Setters
  set pool(pool: AudioPlayerPool) {
    this._pool = pool;
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

  // Methods
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
    if (this.playerRef?.setRateAsync) {
      await this.playerRef.setRateAsync(nextPlaybackRate, true, 'high');
    }
  }

  play() {
    if (this.isPlaying) {
      return;
    }

    if (this._pool) {
      this._pool.requestPlay(this.id);
    }

    if (this.previewVoiceRecording) {
      if (NativeHandlers.Audio?.resumePlayer) {
        NativeHandlers.Audio.resumePlayer().catch((error) => {
          this.isPlaying = false;
          this.notifyError('failed-to-start', error);
        });
      }
      this.state.partialNext({
        isPlaying: true,
      });
      return;
    }

    if (!this.playerRef) {
      this.notifyError('not-playable');
      return;
    }

    if (this.isExpoCLI) {
      if (this.playerRef?.playAsync) {
        this.handleMaybePromiseError(this.playerRef.playAsync(), 'failed-to-start', () => {
          this.isPlaying = false;
        });
      }
    } else {
      if (this.playerRef?.resume) {
        try {
          this.playerRef.resume();
        } catch (error) {
          this.notifyError('failed-to-start', error);
          return;
        }
      }
    }
    this.state.partialNext({
      isPlaying: true,
    });
  }

  pause() {
    if (!this.isPlaying) {
      return;
    }
    if (this.previewVoiceRecording) {
      if (NativeHandlers.Audio?.pausePlayer) {
        NativeHandlers.Audio.pausePlayer();
      }
      this.state.partialNext({
        isPlaying: false,
      });
      return;
    }

    if (!this.playerRef) {
      return;
    }

    if (this.isExpoCLI) {
      if (this.playerRef?.pauseAsync) {
        this.playerRef.pauseAsync();
      }
    } else {
      if (this.playerRef?.pause) {
        this.playerRef.pause();
      }
    }
    this.state.partialNext({
      isPlaying: false,
    });

    if (this._pool) {
      this._pool.notifyPaused();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  async seek(positionInSeconds: number) {
    const positionInMillis = positionInSeconds * 1000;

    if (this.previewVoiceRecording) {
      this.position = positionInMillis;
      if (NativeHandlers.Audio?.seekToPlayer) {
        await NativeHandlers.Audio.seekToPlayer(positionInMillis);
      } else if (positionInMillis > 0) {
        this.notifyError('seek-not-supported');
      }
      return;
    }
    if (!this.playerRef) {
      return;
    }
    this.position = positionInMillis;
    if (this.isExpoCLI) {
      if (this.playerRef?.setPositionAsync) {
        await this.playerRef.setPositionAsync(positionInMillis);
      } else {
        this.notifyError('seek-not-supported');
      }
    } else {
      if (this.playerRef?.seek) {
        this.playerRef.seek(positionInSeconds);
      } else if (positionInMillis > 0) {
        this.notifyError('seek-not-supported');
      }
    }
  }

  async stop() {
    // First seek to 0 to stop the audio and then pause it
    await this.seek(0);
    this.pause();
  }

  onRemove() {
    this.initRequestId += 1;

    if (this.previewVoiceRecording) {
      if (NativeHandlers.Audio?.stopPlayer) {
        NativeHandlers.Audio.stopPlayer();
      }
      this.state.partialNext({
        ...INITIAL_STATE,
        currentPlaybackRate: this.playbackRates[0],
        playbackRates: DEFAULT_PLAYBACK_RATES,
      });
      return;
    }

    if (this.playerRef?.stopAsync) {
      this.playerRef.stopAsync();
    }

    if (this.playerRef?.unloadAsync) {
      this.playerRef.unloadAsync();
    }

    this.playerRef = null;
    this.state.partialNext({
      ...INITIAL_STATE,
      currentPlaybackRate: this.playbackRates[0],
      playbackRates: DEFAULT_PLAYBACK_RATES,
    });
  }
}
