import type { Attachment, LocalMessage, MessageResponse } from 'stream-chat';

import type { AIMessage } from './types';

import { AI_UI_CUSTOM_DATA_KEY, parseAIUIDocument } from '../generative-ui/AIUIDocument';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { parseMessageParts } from '../message-parts/parseMessageParts';

/** A Stream message, as the channel's state or an event has it. */
export type AIStreamMessage = Pick<LocalMessage | MessageResponse, 'attachments' | 'id' | 'text'> &
  Record<string, unknown>;

export type FromStreamMessageOptions = {
  /** Whether the agent wrote it. Defaults to the message's `ai_generated` field. */
  isAssistant?: (message: AIStreamMessage) => boolean;
  /** The whole of a reasoning step's thinking, when the app has it, such as from live updates. */
  reasoningText?: (messageId: string, stepId: string) => string | undefined;
};

// Images and files only: the steps (`ai_*`) are read as parts, link previews Stream made from
// the text are left out, and other kinds are the app's.
const attachmentOf = (attachment: Attachment): AIMessageAttachmentData | undefined => {
  if (attachment.og_scrape_url) return undefined;
  const name = attachment.title ?? attachment.fallback ?? undefined;
  if (attachment.type === 'image') {
    const url = attachment.image_url ?? attachment.asset_url ?? attachment.thumb_url;
    return url ? { kind: 'image', mimeType: attachment.mime_type, name, url } : undefined;
  }
  if (attachment.type === 'file') {
    const size = Number(attachment.file_size);
    return attachment.asset_url
      ? {
          kind: 'file',
          mimeType: attachment.mime_type,
          name,
          size: Number.isFinite(size) && size > 0 ? size : undefined,
          url: attachment.asset_url,
        }
      : undefined;
  }
  return undefined;
};

/**
 * Adapts a Stream message for `AIConversation`: a reply is one with `ai_generated: true`, it is
 * being written while `generating: true`, its steps are its `ai_reasoning` and `ai_tool_call`
 * attachments, its images and files are its other attachments, and the UI the agent wrote for
 * it is its `ai_ui` field. A person's message has no UI, whatever its fields say.
 */
export const fromStreamMessage = (
  message: AIStreamMessage,
  { isAssistant, reasoningText }: FromStreamMessageOptions = {},
): AIMessage => {
  const attachments = message.attachments ?? [];
  const assistant = isAssistant ? isAssistant(message) : message.ai_generated === true;
  const uiDocument = assistant ? parseAIUIDocument(message[AI_UI_CUSTOM_DATA_KEY]) : undefined;
  return {
    attachments: attachments
      .map(attachmentOf)
      .filter((attachment): attachment is AIMessageAttachmentData => !!attachment),
    id: message.id,
    isGenerating: message.generating === true,
    parts: parseMessageParts(attachments),
    reasoningText: reasoningText
      ? (stepId: string) => reasoningText(message.id, stepId)
      : undefined,
    role: assistant ? 'assistant' : 'user',
    text: message.text ?? '',
    ...(uiDocument ? { uiDocument } : {}),
  };
};

/**
 * A `fromStreamMessage` that gives back the same `AIMessage` for the same Stream message object.
 * The channel's state replaces only the messages that change, so mapping its messages through it
 * on every update leaves the others as they were, and `AIConversation` renders only the changed
 * ones again. Make one per conversation, such as with `useState(() => createFromStreamMessage())`.
 */
export const createFromStreamMessage = (options?: FromStreamMessageOptions) => {
  const cache = new WeakMap<AIStreamMessage, AIMessage>();
  return (message: AIStreamMessage) => {
    let adapted = cache.get(message);
    if (!adapted) {
      adapted = fromStreamMessage(message, options);
      cache.set(message, adapted);
    }
    return adapted;
  };
};
