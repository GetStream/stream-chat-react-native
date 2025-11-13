import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';

import { AudioPlayerPool } from '../../state-store/audio-player-pool';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type AudioPlayerPoolContextProps = {
  allowConcurrentAudioPlayback: boolean;
};

export type AudioPlayerPoolContextValue = {
  audioPlayerPool: AudioPlayerPool;
};

export const AudioPlayerPoolContext = createContext<AudioPlayerPoolContextValue>(
  DEFAULT_BASE_CONTEXT_VALUE as AudioPlayerPoolContextValue,
);

export const AudioPlayerPoolProvider = ({
  props: { allowConcurrentAudioPlayback },
  children,
}: PropsWithChildren<{ props: AudioPlayerPoolContextProps }>) => {
  const audioPlayerPool = useMemo(
    () => new AudioPlayerPool({ allowConcurrentAudioPlayback }),
    [allowConcurrentAudioPlayback],
  );
  const audioPlayerPoolContextValue = useMemo(() => ({ audioPlayerPool }), [audioPlayerPool]);

  useEffect(
    () => () => {
      audioPlayerPool.clear();
    },
    [audioPlayerPool],
  );

  return (
    <AudioPlayerPoolContext.Provider value={audioPlayerPoolContextValue}>
      {children}
    </AudioPlayerPoolContext.Provider>
  );
};

export const useAudioPlayerPoolContext = () => useContext(AudioPlayerPoolContext);
