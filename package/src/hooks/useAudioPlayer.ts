import React, { useCallback } from 'react';

import { NativeHandlers, SoundReturnType } from '../native';

export type UseSoundPlayerProps = {
  soundRef: React.MutableRefObject<SoundReturnType | null>;
};

/**
 * This hook is used to play, pause, seek and change audio speed.
 * It handles both Expo CLI and Native CLI.
 *
 * @deprecated This is deprecated and will be removed in the future.
 */
export const useAudioPlayer = (props: UseSoundPlayerProps) => {
  const { soundRef } = props;

  const isExpoCLI = NativeHandlers.SDK === 'stream-chat-expo';

  const playAudio = useCallback(async () => {
    if (isExpoCLI) {
      if (soundRef.current?.playAsync) {
        await soundRef.current.playAsync();
      }
    } else {
      if (soundRef.current?.resume) {
        soundRef.current.resume();
      }
    }
  }, [isExpoCLI, soundRef]);

  const pauseAudio = useCallback(async () => {
    if (isExpoCLI) {
      if (soundRef.current?.pauseAsync) {
        await soundRef.current.pauseAsync();
      }
    } else {
      if (soundRef.current?.pause) {
        soundRef.current.pause();
      }
    }
  }, [isExpoCLI, soundRef]);

  const seekAudio = useCallback(
    async (currentTimeInSeconds: number = 0) => {
      if (isExpoCLI) {
        if (currentTimeInSeconds === 0) {
          // If currentTime is 0, we should replay the video from 0th position.
          if (soundRef.current?.replayAsync) {
            await soundRef.current.replayAsync({});
          }
        } else {
          if (soundRef.current?.setPositionAsync) {
            await soundRef.current.setPositionAsync(currentTimeInSeconds);
          }
        }
      } else {
        if (soundRef.current?.seek) {
          soundRef.current.seek(currentTimeInSeconds);
        }
      }
    },
    [isExpoCLI, soundRef],
  );

  const changeAudioSpeed = useCallback(
    async (speed: number) => {
      // Handled through prop `rate` in `Sound.Player`
      if (!isExpoCLI) {
        return;
      }
      if (soundRef.current?.setRateAsync) {
        await soundRef.current.setRateAsync(speed, true, 'high');
      }
    },
    [isExpoCLI, soundRef],
  );

  return { changeAudioSpeed, pauseAudio, playAudio, seekAudio };
};
