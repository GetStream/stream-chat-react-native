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
  // With `ownTurnOnly`, those of `replaced` in the target's own turn, up to the person's next
  // message: the ones its reply can be written in place of. A later turn's reply that changes is
  // not its reply. Without it, any of `replaced`.
  private readonly rewritable: Set<string> | undefined;
  // With `ownTurnOnly`, for a regenerate or an edit of a message there was, where the target
  // is: after the message before it, by id, which older messages loaded meanwhile don't move.
  private readonly target: { before: string | undefined; index: number } | undefined;
  // The person's message on its way.
  readonly pending: AIPendingMessage | undefined;

  constructor(
    // Tells it apart from the requests before and after it.
    readonly id: number,
    readonly request: AIConversationRequest<Message>,
    conversation: readonly Message[],
    // Whether only the target's own turn can hold its reply written in place, as when the
    // transport switches versions and any message can be answered again.
    ownTurnOnly = false,
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
    const nextQuestion = conversation.findIndex(
      (message, index) => target >= 0 && index > target && message.role === 'user',
    );
    this.target =
      ownTurnOnly && this.replaced.size > 0
        ? { before: conversation[target - 1]?.id, index: target }
        : undefined;
    this.rewritable = ownTurnOnly
      ? new Set(
          [...this.replaced.keys()].slice(0, nextQuestion >= 0 ? nextQuestion - target : undefined),
        )
      : undefined;
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

  // Where the target is in `conversation` now: after the message before it, or where it was
  // when that one is gone.
  private targetIndexIn(conversation: readonly Message[]) {
    if (!this.target) return -1;
    const { before, index } = this.target;
    if (before === undefined) return 0;
    const at = conversation.findIndex((message) => message.id === before);
    return at >= 0 ? at + 1 : index;
  }

  // The messages the conversation leaves out while it waits: those it replaces, and, while the
  // transport switches versions, any from the target's position on, such as the copies of a
  // version a switch shows, which the transport re-sends as it answers it again.
  hiddenIn(conversation: readonly Message[]): ReadonlySet<string> {
    if (!this.target) return new Set(this.replaced.keys());
    const from = this.targetIndexIn(conversation);
    return new Set([...this.replaced.keys(), ...conversation.slice(from).map(({ id }) => id)]);
  }

  // The latest message when it is the request's reply: a reply that wasn't there, or one the
  // request replaces, once it is written again. A copy the transport re-sent (`resentFrom`), as
  // it brought back a version a switch shows, never is, whenever it arrives.
  //
  // For a regenerate or an edit while the transport switches versions, a reply that wasn't there
  // counts only when it comes at or after the target's position (after it, for an edit), found
  // by the message before the target, finished or not. A reply written in place of one in the
  // target's own turn counts as before.
  reply(conversation: readonly Message[]) {
    const index = conversation.length - 1;
    const last = conversation[index];
    if (!last || last.role === 'user' || last.resentFrom !== undefined) return undefined;
    const original =
      (this.rewritable?.has(last.id) ?? true) ? this.replaced.get(last.id) : undefined;
    if (original) return isRewritten(last, original) ? last : undefined;
    if (this.known.has(last.id)) return undefined;
    if (!this.target) return last;
    const target = this.targetIndexIn(conversation);
    const isAfterTarget = this.request.kind === 'edit' ? index > target : index >= target;
    return isAfterTarget ? last : undefined;
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
    return conversation
      .slice(lastKnown + 1)
      .some((message) => message.role === 'user' && message.resentFrom === undefined);
  }

  // What `retry()` sends:
  // - After the transport failed to send it, the request again under the same id, which the
  //   backend may already have.
  // - Once the agent had it but didn't answer, the request again under a new id: a backend that
  //   tells requests apart by id, such as the Stream Agents router, takes the same id for one it
  //   already handled and starts nothing. When the person's message arrived, a request for its
  //   reply instead, since sending it again would add it twice.
  retryRequest(conversation: readonly Message[]): AIConversationRequest<Message> {
    if (this.state !== 'unanswered') return this.request;
    if (this.request.kind === 'message' && this.hasMessageArrived(conversation)) {
      return {
        attachments: [],
        kind: 'regenerate',
        messageId: generateUUIDv4(),
        text: this.request.text,
      };
    }
    return { ...this.request, messageId: generateUUIDv4() };
  }
}
