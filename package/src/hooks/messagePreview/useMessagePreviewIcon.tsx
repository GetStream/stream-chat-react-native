import { DraftMessage, LocalMessage, MessageResponse } from 'stream-chat';

import { useGroupedAttachments } from './useGroupedAttachments';

import { CircleBan } from '../../icons/CircleBan';
import { NewFile } from '../../icons/NewFile';
import { NewLink } from '../../icons/NewLink';
import { NewMapPin } from '../../icons/NewMapPin';
import { NewMic } from '../../icons/NewMic';
import { NewPhoto } from '../../icons/NewPhoto';
import { NewPoll } from '../../icons/NewPoll';
import { NewVideo } from '../../icons/NewVideo';
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
    return NewPoll;
  }

  if (message.shared_location) {
    return NewMapPin;
  }

  if (hasLink) {
    return NewLink;
  }

  if (onlyAudio || onlyVoiceRecordings) {
    return NewMic;
  }

  if (onlyVideos) {
    return NewVideo;
  }

  if (onlyImages) {
    return NewPhoto;
  }

  if (giphys?.length) {
    return NewFile;
  }

  if (files?.length || images?.length || videos?.length || audios?.length) {
    return NewFile;
  }

  return null;
};
