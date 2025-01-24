import { Sound, SoundReturnType } from '../native';

export type UseSoundPlayerProps = {
  soundRef: React.MutableRefObject<SoundReturnType | null>;
};

/**
 * This hook is used to play, pause, seek and change audio speed.
 * It handles both Expo CLI and Native CLI.
 */
export const useAudioPlayer = (props: UseSoundPlayerProps) => {
  const { soundRef } = props;

  const isExpoCLI = !Sound.Player && Sound.initializeSound;

  const playAudio = async () => {
    if (isExpoCLI) {
      if (soundRef.current?.playAsync) await soundRef.current.playAsync();
    } else {
      if (soundRef.current?.resume) soundRef.current.resume();
    }
  };

  const pauseAudio = async () => {
    if (isExpoCLI) {
      if (soundRef.current?.pauseAsync) await soundRef.current.pauseAsync();
    } else {
      if (soundRef.current?.pause) soundRef.current.pause();
    }
  };

  const seekAudio = async (currentTime: number) => {
    if (isExpoCLI) {
      if (soundRef.current?.setPositionAsync)
        await soundRef.current.setPositionAsync(currentTime * 1000);
    } else {
      if (soundRef.current?.seek) soundRef.current.seek(currentTime);
    }
  };

  const changeAudioSpeed = async (speed: number) => {
    // Handled through prop `rate` in `Sound.Player`
    if (!isExpoCLI) return;
    if (soundRef.current?.setRateAsync) await soundRef.current.setRateAsync(speed);
  };

  return { changeAudioSpeed, pauseAudio, playAudio, seekAudio };
};
