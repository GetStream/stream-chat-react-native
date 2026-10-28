import { useEffect } from 'react';

import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { AIDictation } from '../native/AIDictation';

/**
 * The microphone's live level while dictation listens, from 0 to 1, for the `audioLevel` of
 * `VoiceWave` and `VoiceGlow`. It is `null` while dictation is not listening, which lets a
 * visualization animate speech on its own.
 *
 * The level is a shared value rather than state, so a level changing many times a second
 * re-renders nothing: the visualizations read it once a frame on the UI thread.
 */
export const useDictationAudioLevel = (): SharedValue<number | null> => {
  const level = useSharedValue<number | null>(null);

  useEffect(() => {
    const unsubscribeLevel = AIDictation.addLevelListener((payload) => {
      level.value = typeof payload?.level === 'number' ? payload.level : null;
    });
    const unsubscribeState = AIDictation.addStateListener(({ state }) => {
      if (state !== 'listening' && state !== 'starting') level.value = null;
    });
    const unsubscribeError = AIDictation.addErrorListener(() => {
      level.value = null;
    });

    return () => {
      unsubscribeLevel();
      unsubscribeState();
      unsubscribeError();
      level.value = null;
    };
  }, [level]);

  return level;
};
