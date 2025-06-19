import type { PlaybackStatus, SoundReturnType } from 'stream-chat-react-native-core';

import { AudioComponent } from './AudioVideo';

let ExpoAudioComponent;
let expoCreateSoundPlayer;

try {
  const { createAudioPlayer, AudioModule } = require('expo-audio');
  ExpoAudioComponent = AudioModule;
  expoCreateSoundPlayer = createAudioPlayer;
} catch (e) {
  // do nothing
}

export const Sound = {
  // Always try to prioritize expo-audio if it's there.
  initializeSound: ExpoAudioComponent
    ? async (source, initialStatus, onPlaybackStatusUpdate: (playbackStatus) => void) => {
        await ExpoAudioComponent.setAudioModeAsync({
          playsInSilentMode: true,
        });
        const sound = new ExpoAudioSoundAdapter();
        await sound.loadAsync(source, initialStatus);
        sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
        return sound;
      }
    : AudioComponent
      ? async (source, initialStatus, onPlaybackStatusUpdate: (playbackStatus) => void) => {
          await AudioComponent.setAudioModeAsync({
            playsInSilentModeIOS: true,
          });
          const { sound } = await AudioComponent.Sound.createAsync(
            source,
            initialStatus,
            onPlaybackStatusUpdate,
          );
          return sound;
        }
      : null,
  Player: null,
};

type ExpoAudioPlaybackStatus = {
  currentTime: number;
  didJustFinish: boolean;
  duration: number;
  id: number;
  isBuffering: boolean;
  isLoaded: boolean;
  loop: boolean;
  mute: boolean;
  playbackRate: number;
  playbackState: string;
  playing: boolean;
  reasonForWaitingToPlay: string;
  shouldCorrectPitch: boolean;
  timeControlStatus: string;
};

class ExpoAudioSoundAdapter {
  private player;
  private statusEventListener;
  private initialPitchCorrectionQuality;
  private initialShouldCorrectPitch;

  constructor() {}

  setOnPlaybackStatusUpdate = (
    onPlaybackStatusUpdate: (playbackStatus: PlaybackStatus) => void,
  ) => {
    this.statusEventListener = this.player.addListener(
      'playbackStatusUpdate',
      (playbackStatus: ExpoAudioPlaybackStatus) => {
        onPlaybackStatusUpdate(expoAudioToExpoAvStatusAdapter(playbackStatus));
      },
    );
  };

  // eslint-disable-next-line require-await
  loadAsync = async (source, initialStatus) => {
    this.player = expoCreateSoundPlayer?.(source, initialStatus.progressUpdateIntervalMillis);
    this.initialShouldCorrectPitch = initialStatus.shouldCorrectPitch;
    this.initialPitchCorrectionQuality = initialStatus.pitchCorrectionQuality;
  };

  // eslint-disable-next-line require-await
  stopAsync: SoundReturnType['stopAsync'] = async () => {
    this.player.seekTo(0);
    this.player.pause();
  };

  // eslint-disable-next-line require-await
  unloadAsync: SoundReturnType['unloadAsync'] = async () => {
    this.statusEventListener.remove();
    this.player.release();
  };

  // eslint-disable-next-line require-await
  playAsync: SoundReturnType['playAsync'] = async () => {
    this.player.play();
  };

  // eslint-disable-next-line require-await
  pauseAsync: SoundReturnType['pauseAsync'] = async () => {
    this.player.pause();
  };

  // eslint-disable-next-line require-await
  replayAsync: SoundReturnType['replayAsync'] = async () => {
    this.player.seekTo(0);
  };

  // eslint-disable-next-line require-await
  setPositionAsync: SoundReturnType['setPositionAsync'] = async (milliseconds) => {
    const seconds = milliseconds / 1000;
    this.player.seekTo(seconds);
  };

  // eslint-disable-next-line require-await
  setRateAsync: SoundReturnType['setRateAsync'] = async (
    rate,
    shouldCorrectPitch = this.initialShouldCorrectPitch,
    pitchCorrectionQuality = this.initialPitchCorrectionQuality,
  ) => {
    if (shouldCorrectPitch && pitchCorrectionQuality) {
      this.player.setPlaybackRate(rate, pitchCorrectionQuality);
      return;
    }
    this.player.setPlaybackRate(rate);
  };
}

const expoAudioToExpoAvStatusAdapter = (
  playbackStatus: ExpoAudioPlaybackStatus,
): PlaybackStatus => {
  const { currentTime, didJustFinish, duration, isBuffering, isLoaded, loop, mute, playing } =
    playbackStatus;

  return {
    currentPosition: undefined, // not present in the expo-av api, breaks things if set
    didJustFinish,
    duration: undefined, // not present in the expo-av api, breaks things if set
    durationMillis: duration * 1000,
    error: null, // TODO: check how we can see if there is an error
    isBuffering,
    isLoaded,
    isLooping: loop,
    isMuted: mute,
    isPlaying: playing,
    isSeeking: false, // we don't use this anywhere, so just defaulting to a safe value since nothing similar exists in expo-audio
    positionMillis: currentTime * 1000,
    shouldPlay: undefined, // we cannot determine whether the audio should be playing or not
  };
};
