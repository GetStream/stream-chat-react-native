import type { AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet } from 'expo-av';

import { AudioComponent } from '../optionalDependencies/Video';

export const Sound = {
  initializeSound: AudioComponent
    ? async (
        source: AVPlaybackSource,
        initialStatus: AVPlaybackStatusToSet,
        onPlaybackStatusUpdate: (playbackStatus: AVPlaybackStatus) => void,
      ) => {
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
