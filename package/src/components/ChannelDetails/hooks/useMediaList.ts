import { useMemo } from 'react';

import { type Attachment, isScrapedContent, type MessageResponse } from 'stream-chat';

import { FileTypes } from '../../../types/types';

/**
 * A single image/video attachment paired with the message it belongs to. The media grid renders
 * one tile per attachment, so a message with multiple media attachments yields multiple tiles.
 *
 * @experimental This type is experimental and is subject to change.
 */
export type MediaTile = {
  attachment: Attachment;
  message: MessageResponse;
};

/**
 * Flattens search-result messages into one tile per renderable image/video attachment, applying
 * the same attachment rules the message list uses to decide what counts as gallery media.
 */
const getMediaTiles = (messages: MessageResponse[] | undefined): MediaTile[] => {
  if (!messages) {
    return [];
  }
  const tiles: MediaTile[] = [];
  for (const message of messages) {
    if (!message.attachments) {
      continue;
    }
    for (const attachment of message.attachments) {
      if (
        (attachment.type === FileTypes.Image || attachment.type === FileTypes.Video) &&
        !isScrapedContent(attachment)
      ) {
        tiles.push({ attachment, message });
      }
    }
  }
  return tiles;
};

/**
 * Gathers and filters the image/video attachments from a list of messages into a flat list of
 * media tiles, ready to render in the media grid. Scraped/OG link-preview attachments and
 * non-media attachments are excluded.
 *
 * @experimental This hook is experimental and is subject to change.
 */
export const useMediaList = (messages?: MessageResponse[]): MediaTile[] =>
  useMemo(() => getMediaTiles(messages), [messages]);
