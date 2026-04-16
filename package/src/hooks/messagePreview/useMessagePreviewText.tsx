import dayjs from 'dayjs';
import {
  DraftMessage,
  LiveLocationPayload,
  LocalMessage,
  MessageResponse,
  PollState,
} from 'stream-chat';

import { useGroupedAttachments } from './useGroupedAttachments';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks/useStateStore';

const selector = (nextValue: PollState) => ({
  name: nextValue.name,
});

export const useMessagePreviewText = ({
  message,
}: {
  message?: LocalMessage | MessageResponse | DraftMessage | null;
}) => {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const poll = client.polls.fromState(message?.poll_id ?? '');
  const { name: pollName } = useStateStore(poll?.state, selector) ?? {};
  const { giphys, audios, images, videos, files, voiceRecordings } = useGroupedAttachments(
    message?.attachments,
  );
  const attachmentsLength = message?.attachments?.length;

  const onlyImages = images?.length && images?.length === attachmentsLength;
  const onlyVideos = videos?.length && videos?.length === attachmentsLength;
  const onlyFiles = files?.length && files?.length === attachmentsLength;
  const onlyAudio = audios?.length === attachmentsLength;
  const onlyVoiceRecordings =
    voiceRecordings?.length && voiceRecordings?.length === attachmentsLength;
  if (message?.type === 'deleted') {
    return t('Message deleted');
  }

  if (pollName) {
    return pollName;
  }

  if (message?.shared_location) {
    if (
      // There is a problem with types in Draft Message, and its not able to infer the type of `end_at` correctly, so the `as` is used.
      (message?.shared_location as LiveLocationPayload)?.end_at &&
      new Date((message?.shared_location as LiveLocationPayload)?.end_at) > new Date()
    ) {
      return t('Live Location');
    }
    return t('Location');
  }

  if (giphys?.length) {
    return t('Giphy');
  }

  if (message?.text) {
    return message.text;
  }

  if (onlyImages) {
    if (images?.length === 1) {
      return t('Photo');
    } else {
      return t('{{count}} Photos', { count: images?.length });
    }
  }

  if (onlyVideos) {
    if (videos?.length === 1) {
      return t('Video');
    } else {
      return t(`{{count}} Videos`, { count: videos?.length });
    }
  }

  if (onlyAudio) {
    if (audios?.length === 1) {
      return t('Audio');
    } else {
      return t('{{count}} Audios', { count: audios?.length });
    }
  }

  if (onlyVoiceRecordings) {
    if (voiceRecordings?.length === 1) {
      return t(`Voice message ({{duration}})`, {
        duration: dayjs.duration(voiceRecordings?.[0]?.duration ?? 0, 'seconds').format('m:ss'),
      });
    } else {
      return t('{{count}} Voice messages', { count: voiceRecordings?.length });
    }
  }

  if (onlyFiles && files?.length === 1) {
    return files?.[0]?.title;
  }

  return t('{{count}} Files', { count: attachmentsLength });
};
