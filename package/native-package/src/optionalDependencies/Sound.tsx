import type { PlaybackStatus, SoundReturnType } from 'stream-chat-react-native-core';

type InitialPlaybackStatus = {
  positionMillis?: number;
  progressUpdateIntervalMillis?: number;
  rate?: number;
};

type LegacyAudioRecorderPlayerConstructor = new () => NativePlaybackInstance;

let LegacyAudioRecorderPlayer: LegacyAudioRecorderPlayerConstructor | undefined;
let createNitroSound: (() => NativePlaybackInstance) | undefined;

try {
  ({ createSound: createNitroSound } = require('react-native-nitro-sound'));
} catch (e) {
  // do nothing
}

try {
  LegacyAudioRecorderPlayer = require('react-native-audio-recorder-player').default;
} catch (e) {
  // do nothing
}

const PROGRESS_UPDATE_INTERVAL_MILLIS = 100;

type NativePlaybackMeta = {
  currentPosition?: number;
  duration?: number;
  isFinished?: boolean;
};

type NativePlaybackEndMeta = {
  currentPosition: number;
  duration: number;
};

type NativePlaybackInstance = {
  addPlayBackListener: (callback: (meta: NativePlaybackMeta) => void) => void;
  pausePlayer: () => Promise<string>;
  removePlayBackListener: () => void;
  resumePlayer: () => Promise<string>;
  seekToPlayer: (time: number) => Promise<string>;
  setPlaybackSpeed?: (playbackSpeed: number) => Promise<string>;
  setSubscriptionDuration?: (seconds: number) => void | Promise<string>;
  startPlayer: (uri?: string, httpHeaders?: Record<string, string>) => Promise<string>;
  stopPlayer: () => Promise<string>;
  addPlaybackEndListener?: (callback: (meta: NativePlaybackEndMeta) => void) => void;
  dispose?: () => void;
  removePlaybackEndListener?: () => void;
};

const createPlaybackInstance = (): NativePlaybackInstance | null => {
  if (createNitroSound) {
    return createNitroSound();
  }

  if (LegacyAudioRecorderPlayer) {
    return new LegacyAudioRecorderPlayer();
  }

  return null;
};

const createPlaybackStatus = ({
  didJustFinish = false,
  durationMillis,
  error = '',
  isLoaded,
  isPlaying,
  positionMillis,
}: {
  didJustFinish?: boolean;
  durationMillis: number;
  error?: string;
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
}): PlaybackStatus => ({
  currentPosition: positionMillis,
  didJustFinish,
  duration: durationMillis,
  durationMillis,
  error,
  isBuffering: false,
  isLoaded,
  isLooping: false,
  isMuted: false,
  isPlaying,
  isSeeking: false,
  positionMillis,
  shouldPlay: isPlaying,
});

class NativeAudioSoundAdapter implements SoundReturnType {
  testID = 'native-audio-sound';
  onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void;
  private playbackInstance: NativePlaybackInstance | null;
  private sourceUri?: string;
  private isDisposed = false;
  private isLoaded = false;
  private playing = false;
  private durationMillis = 0;
  private positionMillis = 0;
  private playbackRate = 1;
  private hasProgressListener = false;
  private hasPlaybackEndListener = false;

  constructor({
    source,
    initialStatus,
    onPlaybackStatusUpdate,
  }: {
    source?: { uri: string };
    initialStatus?: InitialPlaybackStatus;
    onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void;
  }) {
    this.playbackInstance = createPlaybackInstance();
    this.sourceUri = source?.uri;
    this.onPlaybackStatusUpdate = onPlaybackStatusUpdate;
    this.playbackRate = initialStatus?.rate ?? 1;
    this.positionMillis = initialStatus?.positionMillis ?? 0;
    const progressUpdateIntervalMillis =
      initialStatus?.progressUpdateIntervalMillis ?? PROGRESS_UPDATE_INTERVAL_MILLIS;

    this.playbackInstance?.setSubscriptionDuration?.(progressUpdateIntervalMillis / 1000);
  }

  private emitPlaybackStatus({
    didJustFinish = false,
    error = '',
  }: {
    didJustFinish?: boolean;
    error?: string;
  } = {}) {
    this.onPlaybackStatusUpdate?.(
      createPlaybackStatus({
        didJustFinish,
        durationMillis: this.durationMillis,
        error,
        isLoaded: this.isLoaded,
        isPlaying: this.playing,
        positionMillis: this.positionMillis,
      }),
    );
  }

  private attachListeners() {
    if (!this.playbackInstance || this.hasProgressListener) {
      return;
    }

    this.playbackInstance.addPlayBackListener(this.handlePlaybackProgress);
    this.hasProgressListener = true;

    if (this.playbackInstance.addPlaybackEndListener) {
      this.playbackInstance.addPlaybackEndListener(this.handlePlaybackEnd);
      this.hasPlaybackEndListener = true;
    }
  }

  private detachListeners() {
    if (!this.playbackInstance) {
      return;
    }

    if (this.hasProgressListener) {
      this.playbackInstance.removePlayBackListener();
      this.hasProgressListener = false;
    }

    if (this.hasPlaybackEndListener && this.playbackInstance.removePlaybackEndListener) {
      this.playbackInstance.removePlaybackEndListener();
      this.hasPlaybackEndListener = false;
    }
  }

  private handlePlaybackProgress = ({
    currentPosition,
    duration,
    isFinished,
  }: NativePlaybackMeta) => {
    this.positionMillis = currentPosition ?? this.positionMillis;
    this.durationMillis = duration ?? this.durationMillis;

    const didJustFinish =
      isFinished === true && this.durationMillis > 0 && this.positionMillis >= this.durationMillis;

    if (didJustFinish) {
      this.playing = false;
    }

    this.emitPlaybackStatus({ didJustFinish });
  };

  private handlePlaybackEnd = ({ currentPosition, duration }: NativePlaybackEndMeta) => {
    this.positionMillis = currentPosition ?? this.positionMillis;
    this.durationMillis = duration ?? this.durationMillis;
    this.playing = false;
    this.emitPlaybackStatus({ didJustFinish: true });
  };

  private async ensureLoaded({ shouldPlay }: { shouldPlay: boolean }) {
    if (!this.playbackInstance || this.isDisposed || !this.sourceUri) {
      return false;
    }

    if (!this.isLoaded) {
      this.attachListeners();
      await this.playbackInstance.startPlayer(this.sourceUri);
      this.isLoaded = true;

      if (this.playbackRate !== 1 && this.playbackInstance.setPlaybackSpeed) {
        await this.playbackInstance.setPlaybackSpeed(this.playbackRate);
      }

      if (this.positionMillis > 0) {
        await this.playbackInstance.seekToPlayer(this.positionMillis);
      }

      if (!shouldPlay) {
        await this.playbackInstance.pausePlayer();
      }
    } else if (shouldPlay) {
      await this.playbackInstance.resumePlayer();
    }

    return true;
  }

  playAsync: SoundReturnType['playAsync'] = async () => {
    const loaded = await this.ensureLoaded({ shouldPlay: true });
    if (!loaded) {
      return;
    }

    this.playing = true;
    this.emitPlaybackStatus();
  };

  resume: SoundReturnType['resume'] = () => {
    void this.playAsync?.();
  };

  pauseAsync: SoundReturnType['pauseAsync'] = async () => {
    if (!this.playbackInstance || !this.isLoaded || this.isDisposed) {
      return;
    }

    await this.playbackInstance.pausePlayer();
    this.playing = false;
    this.emitPlaybackStatus();
  };

  pause: SoundReturnType['pause'] = () => {
    void this.pauseAsync?.();
  };

  seek: SoundReturnType['seek'] = async (progress) => {
    const loaded = await this.ensureLoaded({ shouldPlay: false });
    if (!loaded || !this.playbackInstance) {
      return;
    }

    this.positionMillis = progress * 1000;
    await this.playbackInstance.seekToPlayer(this.positionMillis);
    this.emitPlaybackStatus();
  };

  setPositionAsync: SoundReturnType['setPositionAsync'] = async (millis) => {
    await this.seek?.(millis / 1000);
  };

  setRateAsync: SoundReturnType['setRateAsync'] = async (rate) => {
    this.playbackRate = rate;

    if (this.playbackInstance?.setPlaybackSpeed && this.isLoaded) {
      await this.playbackInstance.setPlaybackSpeed(rate);

      // Some Android backends resume playback as a side effect of changing speed.
      // Preserve the previous paused state explicitly so rate changes stay silent.
      if (!this.playing) {
        await this.playbackInstance.pausePlayer();
        this.emitPlaybackStatus();
      }
    }
  };

  replayAsync: SoundReturnType['replayAsync'] = async () => {
    await this.stopAsync?.();
    this.positionMillis = 0;
    await this.playAsync?.();
  };

  stopAsync: SoundReturnType['stopAsync'] = async () => {
    if (!this.playbackInstance || !this.isLoaded || this.isDisposed) {
      return;
    }

    await this.playbackInstance.stopPlayer();
    this.isLoaded = false;
    this.playing = false;
    this.positionMillis = 0;
    this.emitPlaybackStatus();
  };

  unloadAsync: SoundReturnType['unloadAsync'] = async () => {
    if (this.isDisposed) {
      return;
    }

    try {
      if (this.isLoaded && this.playbackInstance) {
        await this.playbackInstance.stopPlayer();
      }
    } catch {
      // Best effort cleanup.
    }

    this.detachListeners();
    this.playbackInstance?.dispose?.();
    this.isLoaded = false;
    this.playing = false;
    this.isDisposed = true;
  };
}

const initializeSound =
  createNitroSound || LegacyAudioRecorderPlayer
    ? (
        source?: { uri: string },
        initialStatus?: InitialPlaybackStatus,
        onPlaybackStatusUpdate?: (playbackStatus: PlaybackStatus) => void,
      ) => {
        if (!source?.uri) {
          return null;
        }

        const sound = new NativeAudioSoundAdapter({
          initialStatus,
          onPlaybackStatusUpdate,
          source,
        });

        return sound;
      }
    : null;

export const Sound = {
  initializeSound,
  Player: null,
};
