import { useCallback, useMemo } from 'react';

import { useNotificationApi } from '../components/Notifications';
import { useAudioPlayerContext } from '../contexts/audioPlayerContext/AudioPlayerContext';
import { useChatContext } from '../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../contexts/translationContext/TranslationContext';
import { AudioPlayerErrorCode, AudioPlayerOptions } from '../state-store/audio-player';

export type UseAudioPlayerProps = {
  /**
   * Identifier of the entity that requested the playback, such as a message ID. It scopes the
   * audio player ID (`requester:src:id`), as one URL can back several UI elements and one UI
   * element can show several sources.
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
        'failed-to-start': t('audioPlayer.playbackFailed.error', 'Failed to play the recording'),
        'not-playable': t(
          'audioPlayer.formatUnsupported.error',
          'Recording format is not supported and cannot be reproduced',
        ),
        'seek-not-supported': t(
          'audioPlayer.seekUnsupported.error',
          'Cannot seek in the recording',
        ),
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
