import { AudioComponent } from './AudioVideo';

export const Sound = {
  initializeSound: AudioComponent
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
