import { useMemo } from 'react';

import { type Attachment, isScrapedContent, type MessageResponse } from 'stream-chat';

import { FileTypes } from '../../../types/types';

/**
 * An image or video attachment with its message. A message with several media attachments yields
 * one tile per attachment.
 */
export type MediaTile = {
  attachment: Attachment;
  message: MessageResponse;
};

// One tile per image or video attachment, excluding scraped link previews.
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
 * Flattens the messages into one tile per image or video attachment. Scraped link previews and
 * other attachment types are excluded.
 *
 * @param messages The messages to gather attachments from.
 * @returns The media tiles.
 */
export const useMediaList = (messages?: MessageResponse[]): MediaTile[] =>
  useMemo(() => getMediaTiles(messages), [messages]);
