import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useGroupedAttachments } from '../../hooks/messagePreview/useGroupedAttachments';

import { CircleBan } from '../../icons/no-sign';
import { File } from '../../icons/file';
import { Link } from '../../icons/link';
import { MapPin } from '../../icons/location';
import { Mic } from '../../icons/voice';
import { PhotoIcon } from '../../icons/image';
import { PollIcon } from '../../icons/poll';
import { VideoIcon } from '../../icons/video';
import { FileTypes } from '../../types/types';

export const useMessagePreviewIcon = ({
  message,
}: {
  message?: LocalMessage | MessageResponse | DraftMessage | null;
}) => {
  const { giphys, audios, images, videos, files, voiceRecordings } = useGroupedAttachments(
    message?.attachments,
  );
  const attachmentsLength = message?.attachments?.length;
  if (!message) {
    return null;
  }

  const onlyImages = images?.length && images?.length === attachmentsLength;
  const onlyAudio = audios?.length && audios?.length === attachmentsLength;
  const onlyVideos = videos?.length && videos?.length === attachmentsLength;
  const onlyVoiceRecordings =
    voiceRecordings?.length && voiceRecordings?.length === attachmentsLength;

  const hasLink = message?.attachments?.some(
    (attachment) => attachment.type === FileTypes.Image && attachment.og_scrape_url,
  );

  if (message.type === 'deleted') {
    return CircleBan;
  }

  if (message.poll_id) {
    return PollIcon;
  }

  if (message.shared_location) {
    return MapPin;
  }

  if (hasLink) {
    return Link;
  }

  if (onlyAudio || onlyVoiceRecordings) {
    return Mic;
  }

  if (onlyVideos) {
    return VideoIcon;
  }

  if (onlyImages) {
    return PhotoIcon;
  }

  if (giphys?.length) {
    return File;
  }

  if (files?.length || images?.length || videos?.length || audios?.length) {
    return File;
  }

  return null;
};
