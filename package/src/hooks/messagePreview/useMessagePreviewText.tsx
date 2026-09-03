import dayjs from 'dayjs';
import {
  DraftMessage,
  SharedLocationResponseData,
  LocalMessage,
  MessageResponse,
  PollState,
} from 'stream-chat';

import { nowNs } from 'stream-chat';

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
    return t('message.deleted.text', 'Message deleted');
  }

  if (pollName) {
    return pollName;
  }

  if (message?.shared_location) {
    // Draft messages type `shared_location` loosely, hence the cast. The RESPONSE shape, not the
    // request one: the value here came off a message, so `end_at` is the wire number rather than
    // the `Date` an outgoing request would carry. `end_at` is optional because a static location
    // has no expiry — only a live one does.
    const { end_at: endAt } = message.shared_location as SharedLocationResponseData;
    if (endAt != null && endAt > nowNs()) {
      return t('messagePreview.liveLocation.label', 'Live Location');
    }
    return t('messagePreview.location.label', 'Location');
  }

  if (giphys?.length) {
    return t('messagePreview.giphy.label', 'Giphy');
  }

  if (message?.text) {
    return message.text;
  }

  if (onlyImages) {
    if (images?.length === 1) {
      return t('messagePreview.photo.label', 'Photo');
    } else {
      return t('messagePreview.photos.label', {
        count: images?.length,
        defaultValue_one: '{{count}} Photo',
        defaultValue_other: '{{count}} Photos',
      });
    }
  }

  if (onlyVideos) {
    if (videos?.length === 1) {
      return t('messagePreview.video.label', 'Video');
    } else {
      return t('messagePreview.videos.label', {
        count: videos?.length,
        defaultValue_one: '{{count}} Video',
        defaultValue_other: '{{count}} Videos',
      });
    }
  }

  if (onlyAudio) {
    if (audios?.length === 1) {
      return t('messagePreview.audio.label', 'Audio');
    } else {
      return t('messagePreview.audios.label', {
        count: audios?.length,
        defaultValue_one: '{{count}} Audio',
        defaultValue_other: '{{count}} Audios',
      });
    }
  }

  if (onlyVoiceRecordings) {
    if (voiceRecordings?.length === 1) {
      return t('messagePreview.voiceMessage.label', 'Voice message ({{duration}})', {
        duration: dayjs
          .duration(voiceRecordings?.[0]?.custom?.duration ?? 0, 'seconds')
          .format('m:ss'),
      });
    } else {
      return t('messagePreview.voiceMessages.label', {
        count: voiceRecordings?.length,
        defaultValue_one: '{{count}} Voice message',
        defaultValue_other: '{{count}} Voice messages',
      });
    }
  }

  if (onlyFiles && files?.length === 1) {
    return files?.[0]?.title;
  }

  return t('messagePreview.files.label', {
    // `attachments` may be absent on this fall-through path. It used to render a literal
    // `{{count}}` placeholder there; 0 at least pluralises.
    count: attachmentsLength ?? 0,
    defaultValue_one: '{{count}} File',
    defaultValue_other: '{{count}} Files',
  });
};
