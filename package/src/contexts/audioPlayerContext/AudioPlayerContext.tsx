import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo } from 'react';

import { useStateStore } from '../../hooks/useStateStore';
import {
  AudioPlayerPool,
  AudioPlayerPoolOptions,
  AudioPlayerPoolState,
} from '../../state-store/audio-player-pool';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type AudioPlayerContextProps = {
  allowConcurrentAudioPlayback: boolean;
  /** Passed to the pool, see `AudioPlayerPoolOptions`. Keep it stable: a new one recreates the pool. */
  onPlaybackStarted?: AudioPlayerPoolOptions['onPlaybackStarted'];
};

export type AudioPlayerContextValue = {
  audioPlayerPool: AudioPlayerPool;
};

export const AudioPlayerContext = createContext<AudioPlayerContextValue>(
  DEFAULT_BASE_CONTEXT_VALUE as AudioPlayerContextValue,
);

export const AudioPlayerProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: AudioPlayerContextProps }>) => {
  const { allowConcurrentAudioPlayback, onPlaybackStarted } = value;
  const audioPlayerPool = useMemo(
    () => new AudioPlayerPool({ allowConcurrentAudioPlayback, onPlaybackStarted }),
    [allowConcurrentAudioPlayback, onPlaybackStarted],
  );
  const audioPlayerPoolContextValue = useMemo(() => ({ audioPlayerPool }), [audioPlayerPool]);

  useEffect(
    () => () => {
      audioPlayerPool.clear();
    },
    [audioPlayerPool],
  );

  return (
    <AudioPlayerContext.Provider value={audioPlayerPoolContextValue}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayerContext = () => useContext(AudioPlayerContext);

const activeAudioPlayerSelector = ({ activeAudioPlayer }: AudioPlayerPoolState) => ({
  activeAudioPlayer,
});

export const useActiveAudioPlayer = () => {
  const { audioPlayerPool } = useContext(AudioPlayerContext);
  const { activeAudioPlayer } =
    useStateStore(audioPlayerPool.state, activeAudioPlayerSelector) ?? {};
  return activeAudioPlayer;
};
