import { AudioComponent } from '../optionalDependencies/Video';

export const Sound = {
  initializeSound: AudioComponent
    ? async (source, initialStatus, onPlaybackStatusUpdate: (playbackStatus) => void) => {
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
