import type { Attachment, LocalMessage, MessageResponse } from 'stream-chat';

import type { AIMessage } from './types';

import { AI_UI_CUSTOM_DATA_KEY, parseAIUIDocument } from '../generative-ui/AIUIDocument';
import { withCustomFields } from '../internal/customFields';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { parseMessageParts } from '../message-parts/parseMessageParts';

/** What the adapter reads of a message: a `LocalMessage` or a `MessageResponse` will do. */
export type AIStreamMessage = Pick<LocalMessage | MessageResponse, 'attachments' | 'id' | 'text'>;

export type FromStreamMessageOptions<M extends AIStreamMessage = AIStreamMessage> = {
  /** Whether the agent wrote it. Defaults to the message's `custom.ai_generated` field. */
  isAssistant?: (message: M) => boolean;
  /** The whole of a reasoning step's thinking, when the app has it, such as from live updates. */
  reasoningText?: (messageId: string, stepId: string) => string | undefined;
};

// Images and files only: the steps (`ai_*`) are read as parts, link previews Stream made from
// the text are left out, and other kinds are the app's.
const attachmentOf = (attachment: Attachment): AIMessageAttachmentData | undefined => {
  if (attachment.og_scrape_url) return undefined;
  const name = attachment.title ?? attachment.fallback ?? undefined;
  // stream-chat keeps the file's size and type under `custom`.
  const { file_size, mime_type } = attachment.custom ?? {};
  if (attachment.type === 'image') {
    const url = attachment.image_url ?? attachment.asset_url ?? attachment.thumb_url;
    return url ? { kind: 'image', mimeType: mime_type, name, url } : undefined;
  }
  if (attachment.type === 'file') {
    const size = Number(file_size);
    return attachment.asset_url
      ? {
          kind: 'file',
          mimeType: mime_type,
          name,
          size: Number.isFinite(size) && size > 0 ? size : undefined,
          url: attachment.asset_url,
        }
      : undefined;
  }
  return undefined;
};

/**
 * Adapts a Stream message for `AIConversation`: a reply is one with `custom.ai_generated: true`,
 * it is being written while `custom.generating: true`, its steps are its `ai_reasoning` and
 * `ai_tool_call` attachments, its images and files are its other attachments, and the UI the
 * agent wrote for it is its `custom.ai_ui` field. A person's message has no UI, whatever its
 * fields say.
 */
export const fromStreamMessage = <M extends AIStreamMessage>(
  message: M,
  { isAssistant, reasoningText }: FromStreamMessageOptions<M> = {},
): AIMessage => {
  const attachments = message.attachments ?? [];
  const fields = withCustomFields(message as unknown as Record<string, unknown>);
  const assistant = isAssistant ? isAssistant(message) : fields.ai_generated === true;
  const uiDocument = assistant ? parseAIUIDocument(fields[AI_UI_CUSTOM_DATA_KEY]) : undefined;
  return {
    attachments: attachments
      .map(attachmentOf)
      .filter((attachment): attachment is AIMessageAttachmentData => !!attachment),
    id: message.id,
    isGenerating: fields.generating === true,
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
export const createFromStreamMessage = <M extends AIStreamMessage = AIStreamMessage>(
  options?: FromStreamMessageOptions<M>,
) => {
  const cache = new WeakMap<M, AIMessage>();
  return (message: M) => {
    let adapted = cache.get(message);
    if (!adapted) {
      adapted = fromStreamMessage(message, options);
      cache.set(message, adapted);
    }
    return adapted;
  };
};
