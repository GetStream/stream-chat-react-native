import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useGroupedAttachments } from '../../hooks/messagePreview/useGroupedAttachments';

import { FileTypes } from '../../types/types';

export const useMessagePreviewIcon = ({
  message,
}: {
  message?: LocalMessage | MessageResponse | DraftMessage | null;
}) => {
  const { icons } = useComponentsContext();
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
    return icons.CircleBan;
  }

  if (message.poll_id) {
    return icons.PollIcon;
  }

  if (message.shared_location) {
    return icons.MapPin;
  }

  if (hasLink) {
    return icons.Link;
  }

  if (onlyAudio || onlyVoiceRecordings) {
    return icons.Mic;
  }

  if (onlyVideos) {
    return icons.VideoIcon;
  }

  if (onlyImages) {
    return icons.PhotoIcon;
  }

  if (giphys?.length) {
    return icons.File;
  }

  if (files?.length || images?.length || videos?.length || audios?.length) {
    return icons.File;
  }

  return null;
};
