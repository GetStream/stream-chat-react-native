import { useMemo } from 'react';

import { useAudioPlayerPoolContext } from '../contexts/audioPlayerPoolContext/AudioPlayerPoolContext';
import { AudioPlayerOptions } from '../state-store/audio-player';

export type UseAudioPlayerControlProps = {
  /**
   * Identifier of the entity that requested the audio playback, e.g. message ID.
   * Asset to specific audio player is a many-to-many relationship
   * - one URL can be associated with multiple UI elements,
   * - one UI element can display multiple audio sources.
   * Therefore, the AudioPlayer ID is a combination of request:src.
   *
   * The requester string can take into consideration whether there are multiple instances of
   * the same URL requested by the same requester (message has multiple attachments with the same asset URL).
   * In reality the fact that one message has multiple attachments with the same asset URL
   * could be considered a bad practice or a bug.
   */
  requester?: string;
} & Partial<AudioPlayerOptions>;

const makeAudioPlayerId = ({
  requester,
  src,
  id,
}: {
  src: string;
  requester?: string;
  id?: string;
}) => `${requester ?? 'requester-unknown'}:${src}:${id ?? ''}`;

export const useAudioPlayerControl = ({
  duration,
  mimeType,
  playbackRates,
  previewVoiceRecording,
  requester = '',
  type,
  uri,
  id: fileId,
}: UseAudioPlayerControlProps) => {
  const { audioPlayerPool } = useAudioPlayerPoolContext();
  const id = makeAudioPlayerId({ id: fileId, requester, src: uri ?? '' });
  const audioPlayer = useMemo(
    () =>
      audioPlayerPool?.getOrAddPlayer({
        duration: duration ?? 0,
        id,
        mimeType: mimeType ?? '',
        playbackRates,
        previewVoiceRecording,
        type: type ?? 'audio',
        uri: uri ?? '',
      }),
    [audioPlayerPool, duration, id, mimeType, playbackRates, previewVoiceRecording, type, uri],
  );

  return audioPlayer;
};
