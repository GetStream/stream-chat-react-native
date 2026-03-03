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
import { useStateStore } from '../../hooks';

const selector = (nextValue: PollState) => ({
  name: nextValue.name,
});

export const useMessagePreviewText = ({
  message,
}: {
  message?: LocalMessage | MessageResponse | DraftMessage | null;
}) => {
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
    return 'Message deleted';
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
      return 'Live Location';
    }
    return 'Location';
  }

  if (message?.text) {
    return message?.text;
  }

  if (onlyImages) {
    if (images?.length === 1) {
      return 'Photo';
    } else {
      return `${images?.length} Photos`;
    }
  }

  if (onlyVideos) {
    if (videos?.length === 1) {
      return 'Video';
    } else {
      return `${videos?.length} Videos`;
    }
  }

  if (onlyAudio) {
    if (audios?.length === 1) {
      return 'Audio';
    } else {
      return `${audios?.length} Audios`;
    }
  }

  if (onlyVoiceRecordings) {
    if (voiceRecordings?.length === 1) {
      return `Voice message (${dayjs.duration(voiceRecordings?.[0]?.duration ?? 0, 'seconds').format('m:ss')})`;
    } else {
      return `${voiceRecordings?.length} Voice messages`;
    }
  }

  if (giphys?.length) {
    return 'Giphy';
  }

  if (onlyFiles && files?.length === 1) {
    return files?.[0]?.title;
  }

  return `${attachmentsLength} Files`;
};
