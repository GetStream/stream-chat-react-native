import isEqual from 'lodash/isEqual';

import type { AIConversationRequest } from './types';

import { generateUUIDv4 } from '../../internal/uuid';
import type { AIMessageAttachmentData } from '../../message/AIMessageAttachment';
import type { MediaAsset } from '../../services/media-picker-service/AbstractMediaPickerService';
import type { AIMessage, AIPendingMessage } from '../types';

// Where the request is: waiting for its reply, stopped by the person before it started, not
// sent because the transport failed, or not answered by the agent.
export type AIConversationExchangeState = 'waiting' | 'stopped' | 'failed' | 'unanswered';

// A reply the agent has started with no text, steps or attachments yet. Its generated UI can
// still show, when the conversation's host reads it.
export const hasEmptyContent = (message: AIMessage) =>
  message.role !== 'user' &&
  message.text === '' &&
  !message.parts?.length &&
  !message.attachments?.length;

// Whether a reply is written again since it was `original`: it started anew, or it shows
// something else.
const isRewritten = (message: AIMessage, original: AIMessage) =>
  (!!message.isGenerating && !original.isGenerating) ||
  message.text !== original.text ||
  !isEqual(message.parts ?? [], original.parts ?? []) ||
  !isEqual(message.attachments ?? [], original.attachments ?? []) ||
  !isEqual(message.uiDocument, original.uiDocument);

export const attachmentOfAsset = (asset: MediaAsset): AIMessageAttachmentData => ({
  kind: !asset.type || asset.type.startsWith('image') ? 'image' : 'file',
  mimeType: asset.type?.includes('/') ? asset.type : undefined,
  name: asset.name,
  size: asset.size,
  url: asset.uri,
});

// The latest request, until its reply starts or another request takes its place.
export class AIConversationExchange<Message extends AIMessage> {
  state: AIConversationExchangeState = 'waiting';
  // The messages there were when it was made, none of which is its reply.
  readonly known: Set<string>;
  // The messages it replaces, as they were, which the conversation leaves out while it waits:
  // the reply written again, or the message edited, and those after it.
  readonly replaced: Map<string, Message>;
  // The person's message on its way.
  readonly pending: AIPendingMessage | undefined;

  constructor(
    // Tells it apart from the requests before and after it.
    readonly id: number,
    readonly request: AIConversationRequest<Message>,
    conversation: readonly Message[],
  ) {
    this.known = new Set(conversation.map((message) => message.id));
    const target = request.message
      ? conversation.findIndex((message) => message.id === request.message?.id)
      : -1;
    this.replaced = new Map(
      target >= 0 && (request.kind === 'regenerate' || request.kind === 'edit')
        ? conversation.slice(target).map((message) => [message.id, message])
        : [],
    );
    if (request.kind === 'regenerate') {
      this.pending = undefined;
    } else {
      const edited = request.kind === 'edit' ? (request.message?.attachments ?? []) : [];
      this.pending = {
        attachments: [...edited, ...request.attachments.map(attachmentOfAsset)],
        id: request.messageId,
        text: request.text,
      };
    }
  }

  get hasFailed() {
    return this.state === 'failed' || this.state === 'unanswered';
  }

  // The person's message while the conversation shows it: until its reply starts, and for a
  // new message also once it is stopped or failed, since the agent may have it, or `retry()`
  // sends it again. The messages an edit replaces come back instead.
  get shownPending() {
    return this.state === 'waiting' || this.request.kind === 'message' ? this.pending : undefined;
  }

  // The latest message when it is the request's reply: a reply that wasn't there, or one the
  // request replaces, once it is written again.
  reply(conversation: readonly Message[]) {
    const last = conversation[conversation.length - 1];
    if (!last || last.role === 'user') return undefined;
    const original = this.replaced.get(last.id);
    const rewritten = original ? isRewritten(last, original) : false;
    return !this.known.has(last.id) || rewritten ? last : undefined;
  }

  // Whether its reply has started: it shows something, or it is already finished.
  hasReplyStarted(conversation: readonly Message[]) {
    const reply = this.reply(conversation);
    return !!reply && (!hasEmptyContent(reply) || !reply.isGenerating);
  }

  // Whether the person's message is in the conversation: one with its id, or one of theirs
  // after the messages there were.
  hasMessageArrived(conversation: readonly Message[]) {
    if (conversation.some((message) => message.id === this.request.messageId)) return true;
    let lastKnown = -1;
    conversation.forEach((message, index) => {
      if (this.known.has(message.id)) lastKnown = index;
    });
    return conversation.slice(lastKnown + 1).some((message) => message.role === 'user');
  }

  // What `retry()` sends: the request again, or, when the agent had the person's message but
  // couldn't answer it, a request for its reply, since sending it again would add it twice.
  retryRequest(conversation: readonly Message[]): AIConversationRequest<Message> {
    if (
      this.state !== 'unanswered' ||
      this.request.kind !== 'message' ||
      !this.hasMessageArrived(conversation)
    ) {
      return this.request;
    }
    return {
      attachments: [],
      kind: 'regenerate',
      messageId: generateUUIDv4(),
      text: this.request.text,
    };
  }
}
