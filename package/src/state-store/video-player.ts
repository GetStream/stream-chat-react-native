import { StateStore } from 'stream-chat';

import { VideoPlayerPool } from './video-player-pool';

import { NativeHandlers, VideoType } from '../native';
import { ONE_SECOND_IN_MILLISECONDS } from '../utils/constants';

export type VideoPlayerState = {
  duration: number;
  position: number;
  progress: number;
  isPlaying: boolean;
};

export type VideoDescriptor = {
  id: string;
};

export type VideoPlayerOptions = VideoDescriptor & {
  autoPlay?: boolean;
};

export const INITIAL_VIDEO_PLAYER_STATE: VideoPlayerState = {
  duration: 0,
  isPlaying: false,
  position: 0,
  progress: 0,
};

export class VideoPlayer {
  state: StateStore<VideoPlayerState>;
  options: VideoPlayerOptions;
  playerRef: VideoType | null = null;
  _pool: VideoPlayerPool | null = null;
  private _id: string;
  private isExpoCLI: boolean;

  constructor(options: VideoPlayerOptions) {
    this.isExpoCLI = NativeHandlers.SDK === 'stream-chat-expo';
    this.state = new StateStore<VideoPlayerState>({
      ...INITIAL_VIDEO_PLAYER_STATE,
      isPlaying: options.autoPlay ?? false,
    });
    this.options = options;
    this._id = options.id;
  }

  initPlayer = ({ playerRef }: { playerRef?: VideoType }) => {
    this.playerRef = playerRef ?? null;
  };

  get id() {
    return this._id;
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

  set pool(pool: VideoPlayerPool) {
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

  play() {
    if (this._pool) {
      this._pool.requestPlay(this.id);
    }
    if (this.playerRef?.play) {
      this.playerRef.play();
    }
    this.state.partialNext({
      isPlaying: true,
    });
  }

  pause() {
    if (this.playerRef?.pause) {
      this.playerRef.pause();
    }
    this.state.partialNext({
      isPlaying: false,
    });
    if (this._pool) {
      this._pool.notifyPaused();
    }
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  seek(position: number) {
    this.position = position;
    if (this.isExpoCLI) {
      if (this.playerRef?.seekBy) {
        this.playerRef.seekBy(position / ONE_SECOND_IN_MILLISECONDS);
      }
    } else {
      if (this.playerRef?.seek) {
        this.playerRef.seek(position / ONE_SECOND_IN_MILLISECONDS);
      }
    }
  }

  stop() {
    this.seek(0);
    this.pause();
  }

  onRemove() {
    if (this.playerRef?.pause) {
      this.playerRef.pause();
    }
    this.playerRef = null;
    this.state.partialNext(INITIAL_VIDEO_PLAYER_STATE);
  }
}
