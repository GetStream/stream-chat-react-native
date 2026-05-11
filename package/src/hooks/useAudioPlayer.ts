import { useCallback, useMemo } from 'react';

import { useNotificationApi } from '../components/Notifications';
import { useAudioPlayerContext } from '../contexts/audioPlayerContext/AudioPlayerContext';
import { useChatContext } from '../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import { AudioPlayerErrorCode, AudioPlayerOptions } from '../state-store/audio-player';

export type UseAudioPlayerProps = {
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

export const useAudioPlayer = ({
  duration,
  mimeType,
  playbackRates,
  previewVoiceRecording,
  requester = '',
  type,
  uri,
  id: fileId,
}: UseAudioPlayerProps) => {
  const { audioPlayerPool } = useAudioPlayerContext();
  const { addNotification } = useNotificationApi();
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const hasNotificationManager = !!client?.notifications;
  const id = makeAudioPlayerId({ id: fileId, requester, src: uri ?? '' });
  const onError = useCallback(
    ({ errCode, error }: { errCode: AudioPlayerErrorCode; error?: Error }) => {
      if (!hasNotificationManager) return;

      const errorMessages: Record<AudioPlayerErrorCode, string> = {
        'failed-to-start': t('Failed to play the recording'),
        'not-playable': t('Recording format is not supported and cannot be reproduced'),
        'seek-not-supported': t('Cannot seek in the recording'),
      };
      const message = errorMessages[errCode];

      addNotification({
        message,
        options: {
          originalError: error ?? new Error(message),
          severity: 'error',
          type: 'browser:audio:playback:error',
        },
        origin: { emitter: 'AudioPlayer' },
      });
    },
    [addNotification, hasNotificationManager, t],
  );
  const audioPlayer = useMemo(
    () =>
      audioPlayerPool?.getOrAddPlayer({
        duration: duration ?? 0,
        id,
        mimeType: mimeType ?? '',
        onError,
        playbackRates,
        previewVoiceRecording,
        type: type ?? 'audio',
        uri: uri ?? '',
      }),
    [
      audioPlayerPool,
      duration,
      id,
      mimeType,
      onError,
      playbackRates,
      previewVoiceRecording,
      type,
      uri,
    ],
  );

  return audioPlayer;
};
