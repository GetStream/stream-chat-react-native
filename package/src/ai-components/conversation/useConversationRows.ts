import { type ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  type AIConversationEntry,
  type AIConversationTurn,
  AIPendingMessageTracker,
  turnsOf,
} from './entries';
import type { AIMessage, AIPendingMessage } from './types';

import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { AIThinkingClock } from '../reasoning/thinkingClock';

/**
 * Where a row is: the first of a turn, or within one. The first turn has the same room above it as
 * the others, so older messages arriving above it leave it where it is.
 */
export type RowPosition = 'turn' | 'message';

/** A row of the list: one message, with the turn it belongs to. */
export type EntryRow = {
  entry: AIConversationEntry;
  key: string;
  kind: 'entry';
  position: RowPosition;
  turnKey: string;
  /** The turn's first reasoning step, which takes over the seconds the turn was seen thinking. */
  firstStepId?: string;
};

/**
 * What ends the latest turn: the agent thinking, and the app's footer. A row of its own rather than
 * the list's footer: the list lays its rows out itself, together with the room it leaves under the
 * latest turn, while a footer that goes away shrinks the content at once, which moves the view.
 */
export type TailRow = {
  isThinking: boolean;
  key: string;
  kind: 'tail';
  turnKey: string;
  firstStepId?: string;
  footer?: ReactNode;
};

export type ConversationRow = EntryRow | TailRow;

const TAIL_KEY = 'ai-conversation-tail';

const sameAttachments = (a: AIMessageAttachmentData[], b: AIMessageAttachmentData[]) =>
  a === b || (a.length === 0 && b.length === 0);

// Whether a row can be kept as it was: the list renders a row again only for a new item.
const isSameRow = (row: EntryRow, next: Omit<EntryRow, 'key'>) =>
  row.entry.message === next.entry.message &&
  row.entry.pending === next.entry.pending &&
  row.entry.isLatestReply === next.entry.isLatestReply &&
  sameAttachments(row.entry.sentAttachments, next.entry.sentAttachments) &&
  row.firstStepId === next.firstStepId &&
  row.position === next.position &&
  row.turnKey === next.turnKey;

// The turn's first reasoning step, which takes over the seconds the turn was seen thinking.
const firstStepOf = (turn: AIConversationTurn | undefined) => {
  for (const { message } of turn?.entries ?? []) {
    if (!message || message.role === 'user') continue;
    const step = message.parts?.find((part) => part.reasoning);
    if (step) return step.id;
  }
  return undefined;
};

export type UseConversationRowsOptions = {
  messages: AIMessage[];
  footer?: ReactNode;
  isThinking?: boolean;
  pendingMessage?: AIPendingMessage | null;
};

export type ConversationRows = {
  /** The key of the latest turn's first row, which pins to the top: `undefined` with no turns. */
  anchorKey: string | undefined;
  /** The turns' thinking clock, for `AIThinkingTurnContext`. */
  clock: AIThinkingClock;
  /** The rows to list: each message, then what ends the latest turn while there is any. */
  rows: ConversationRow[];
  /** Whether there are no messages to show yet, not even one on its way. */
  isEmpty: boolean;
};

/**
 * The conversation's data, as rows for a list: its messages grouped into turns, a message on its
 * way until its copy arrives, and what ends the latest turn. Each unchanged row keeps its object,
 * so the list renders only the rows that changed. Knows nothing about the list itself.
 */
export const useConversationRows = ({
  footer,
  isThinking = false,
  messages,
  pendingMessage,
}: UseConversationRowsOptions): ConversationRows => {
  const [tracker] = useState(() => new AIPendingMessageTracker());
  const [clock] = useState(() => new AIThinkingClock());

  const entries = useMemo(
    () => tracker.entries(messages, pendingMessage),
    [messages, pendingMessage, tracker],
  );
  // after `entries`, which matched the copies
  const thinking = isThinking || tracker.isAwaitingReply(messages, pendingMessage);
  const turns = useMemo(() => turnsOf(entries), [entries]);
  const latest = turns[turns.length - 1];
  const latestHasReplies = (latest?.entries.length ?? 0) > 1;
  const latestFirstStepId = firstStepOf(latest);
  const latestHasFirstStep = latestFirstStepId !== undefined;
  // Before the views below read it in their effects and next renders: a turn's thinking starts
  // and ends once.
  useLayoutEffect(() => {
    clock.update(latest?.id, thinking, latestHasReplies, latestHasFirstStep);
  }, [clock, latest?.id, latestHasFirstStep, latestHasReplies, thinking]);

  // The rows, keeping each unchanged one's object, so the list renders only the rows that changed.
  const rowCache = useRef(new Map<string, EntryRow>());
  const entryRows = useMemo(() => {
    const cache = new Map<string, EntryRow>();
    const next: EntryRow[] = [];
    turns.forEach((turn) => {
      const firstStepId = firstStepOf(turn);
      turn.entries.forEach((entry, index) => {
        const fields = {
          entry,
          firstStepId,
          kind: 'entry' as const,
          position: (index > 0 ? 'message' : 'turn') as RowPosition,
          turnKey: turn.id,
        };
        const previous = rowCache.current.get(entry.id);
        const row =
          previous && isSameRow(previous, fields) ? previous : { ...fields, key: entry.id };
        cache.set(entry.id, row);
        next.push(row);
      });
    });
    rowCache.current = cache;
    return next;
  }, [turns]);

  // A turn's id is its first entry's, so the latest turn's first row has its key.
  const lastTurnKey = latest?.id;
  const tailRow = useMemo<TailRow | undefined>(
    () =>
      lastTurnKey !== undefined && (thinking || footer)
        ? {
            firstStepId: latestFirstStepId,
            footer,
            isThinking: thinking,
            key: TAIL_KEY,
            kind: 'tail',
            turnKey: lastTurnKey,
          }
        : undefined,
    [footer, lastTurnKey, latestFirstStepId, thinking],
  );
  const rows = useMemo<ConversationRow[]>(
    () => (tailRow ? [...entryRows, tailRow] : entryRows),
    [entryRows, tailRow],
  );

  return { anchorKey: lastTurnKey, clock, isEmpty: entryRows.length === 0, rows };
};
