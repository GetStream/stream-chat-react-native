import type { AIMessage, AIPendingMessage } from './types';

import type { AIUIDocument } from '../generative-ui/AIUIDocument';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { isToolCallFinished } from '../message-parts/parseMessageParts';

/** A row of the conversation: a message, or a message the person sent that is on its way. */
export type AIConversationEntry = {
  /** The message's id, or, for the copy of a message that was on its way, that message's. */
  id: string;
  isFromUser: boolean;
  /** Whether it is a reply that ends the conversation. */
  isLatestReply: boolean;
  /** The message, or `undefined` for one on its way. */
  message?: AIMessage;
  /** The message on its way, until its copy arrives. */
  pending?: AIPendingMessage;
  /** What the person sent with a message on its way, which its copy shows rather than load it again. */
  sentAttachments: AIMessageAttachmentData[];
};

/** The person's message and the replies to it. */
export type AIConversationTurn = { entries: AIConversationEntry[]; id: string };

/** Whether a reply's generated UI shows, such as `AIUIHost.canShow`. */
export type AIConversationCanShowUI = (document: AIUIDocument) => boolean;

const showsNoUI: AIConversationCanShowUI = () => false;

// A reply the agent has started but that has nothing to show yet: no text, steps or attachments,
// and no UI that `canShowUI` says shows.
const showsNothing = (message: AIMessage, canShowUI: AIConversationCanShowUI) =>
  message.role !== 'user' &&
  message.text === '' &&
  !message.parts?.length &&
  !message.attachments?.length &&
  !(message.uiDocument && canShowUI(message.uiDocument));

// Whether a step is over: a round of reasoning that stopped streaming, or a call that finished.
// A step of a kind this SDK doesn't know counts as over, since it can't say otherwise.
const isStepOver = ({ reasoning, toolCall }: NonNullable<AIMessage['parts']>[number]) =>
  reasoning
    ? reasoning.status !== 'streaming'
    : toolCall
      ? isToolCallFinished(toolCall.status)
      : true;

/**
 * Whether the reply is being written, took steps that are all over, and shows no UI: once its
 * answer stops growing, the agent is thinking again, between its steps. An agent's backend can
 * write a round of reasoning as a step only once it is done, so nothing would show meanwhile. A
 * step still going, such as a call waiting for the person, shows itself instead.
 */
export const hasFinishedSteps = (
  message: AIMessage | undefined,
  canShowUI: AIConversationCanShowUI = showsNoUI,
): message is AIMessage =>
  !!message &&
  message.role !== 'user' &&
  !!message.isGenerating &&
  !!message.parts?.length &&
  message.parts.every(isStepOver) &&
  !(message.uiDocument && canShowUI(message.uiDocument));

/** Groups the rows into turns, each starting with one of the person's messages. */
export const turnsOf = (entries: AIConversationEntry[]) =>
  entries.reduce<AIConversationTurn[]>((turns, entry) => {
    const last = turns[turns.length - 1];
    if (!last || entry.isFromUser) turns.push({ entries: [entry], id: entry.id });
    else last.entries.push(entry);
    return turns;
  }, []);

/**
 * Follows a message the person sent until its copy arrives in the messages, so the copy takes
 * over its row (and its key) without a flicker, and tells whether the agent is surely about to
 * answer. The counterpart of `AIPendingMessageTracker`.
 */
export class AIPendingMessageTracker {
  // The person's messages each pending message's copy cannot be: those there were when it was
  // first seen, and those that arrived since without being its copy, such as older ones.
  private seen = new Map<string, Set<string>>();
  // The pending message each copy took over, by the copy's id.
  private copies = new Map<string, AIPendingMessage>();
  // The pending message of the last update, whose copy can arrive in the update that stops
  // passing it.
  private lastPending?: AIPendingMessage;

  // The rows of a conversation: its messages, apart from replies with nothing to show yet, and
  // a message on its way until its copy arrives. A reply's UI shows when `canShowUI` says.
  entries(
    messages: AIMessage[],
    pending?: AIPendingMessage | null,
    canShowUI: AIConversationCanShowUI = showsNoUI,
  ): AIConversationEntry[] {
    let showsPending = !!pending;
    // A copy that arrives in the update that stops passing its pending message still takes over
    // its row. Only then: a message sent later is not the copy of one that failed.
    const awaited = pending ?? this.lastPending;
    if (awaited) {
      const sent = messages.filter((message) => message.role === 'user');
      const ids = new Set(sent.map((message) => message.id));
      const known = this.seen.get(awaited.id) ?? ids;
      const matched = [...this.copies].find(
        ([copyId, original]) => original.id === awaited.id && ids.has(copyId),
      )?.[0];
      const copy = matched ?? this.copyOf(awaited, sent, known);
      if (copy !== undefined) {
        if (!this.copies.has(copy)) this.copies.set(copy, awaited);
        showsPending = false;
      } else {
        this.seen.set(awaited.id, new Set([...known, ...ids]));
      }
    }
    this.lastPending = pending ?? undefined;

    const entries: AIConversationEntry[] = messages
      .filter((message) => !showsNothing(message, canShowUI))
      .map((message) => {
        const taken = this.copies.get(message.id);
        return {
          id: taken?.id ?? message.id,
          isFromUser: message.role === 'user',
          isLatestReply: false,
          message,
          sentAttachments: taken?.attachments ?? [],
        };
      });
    if (showsPending && pending) {
      entries.push({
        id: pending.id,
        isFromUser: true,
        isLatestReply: false,
        pending,
        sentAttachments: [],
      });
    }
    const last = entries[entries.length - 1];
    if (last && !last.isFromUser) last.isLatestReply = true;
    return entries;
  }

  // The copy of a message that was on its way: the person's message with its id, when the app
  // knew it. Otherwise their first after those known, which older messages loading above cannot
  // be. With none of theirs known, it is their latest, when that is the only new one or says the
  // same.
  private copyOf(pending: AIPendingMessage, sent: AIMessage[], known: Set<string>) {
    const ids = sent.map((message) => message.id);
    if (ids.includes(pending.id)) return pending.id;
    let lastKnown = -1;
    ids.forEach((id, index) => {
      if (known.has(id)) lastKnown = index;
    });
    if (lastKnown >= 0) return ids[lastKnown + 1];
    const fresh = sent.filter((message) => !known.has(message.id));
    const latest = fresh[fresh.length - 1];
    if (!latest || (fresh.length !== 1 && latest.text !== pending.text)) return undefined;
    return latest.id;
  }

  // Whether the latest message is surely waiting for a reply that shows nothing yet: it is on its
  // way, it is the copy of the one on its way, or its reply is being written but shows nothing.
  // Call it after `entries`, which matches the copies.
  isAwaitingReply(
    messages: AIMessage[],
    pending?: AIPendingMessage | null,
    canShowUI: AIConversationCanShowUI = showsNoUI,
  ) {
    const last = messages[messages.length - 1];
    if (last && last.role !== 'user' && last.isGenerating && showsNothing(last, canShowUI))
      return true;
    if (!pending) return false;
    const copy = [...this.copies].find(([, original]) => original.id === pending.id)?.[0];
    if (copy === undefined) return true;
    return last?.id === copy;
  }
}
