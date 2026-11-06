import { createContext, useContext } from 'react';

/** How long a first step that arrived done stays open, showing its reasoning, before it folds. */
export const FINISHED_REASONING_SHOWN_MS = 1600;
/** How long the reasoning takes to fold. */
export const REASONING_FOLD_MS = 450;
// How soon after a turn stops thinking its first step has to arrive, done, to open and show its
// reasoning: it came with the reply that ended the thinking.
const ARRIVAL_WINDOW_MS = 1000;

type Turn = {
  start: number;
  end?: number;
  // How long the first step thought, once it was done, in seconds.
  firstStepDuration?: number;
  firstStepStreamed: boolean;
  // Whether a reply of the turn showed.
  hadReplies: boolean;
};

/**
 * Times each turn's thinking, so the reply's first reasoning step takes over the seconds the
 * conversation counted while it showed the agent thinking. The counterpart of `AIThinkingClock`.
 *
 * It is written only from effects (`update`, `firstStepStreams`, `firstStepDone`) and read
 * during render, so a render React throws away changes nothing.
 */
export class AIThinkingClock {
  private turns = new Map<string, Turn>();

  // A turn's thinking starts the first time it is the latest turn and thinking, and ends when it
  // stops. Thinking that resumes before the first step shows carries on. A turn whose replies were
  // taken away starts thinking afresh.
  update(
    latest: string | undefined,
    isThinking: boolean,
    hasReplies: boolean,
    hasFirstStep: boolean,
    now = Date.now(),
  ) {
    if (latest === undefined) return;
    const timed = this.turns.get(latest);
    if (!timed || (isThinking && timed.hadReplies && !hasReplies)) {
      if (isThinking) {
        this.turns.set(latest, {
          firstStepStreamed: false,
          hadReplies: false,
          start: now,
        });
      }
      return;
    }
    if (hasReplies) timed.hadReplies = true;
    if (isThinking) {
      if (!hasFirstStep) timed.end = undefined;
    } else if (timed.end === undefined) {
      timed.end = now;
    }
  }

  start(turn: string) {
    return this.turns.get(turn)?.start;
  }

  firstStepStreams(turn: string) {
    const timed = this.turns.get(turn);
    if (timed) timed.firstStepStreamed = true;
  }

  // The first step stopped streaming: it thought from when the turn started thinking until now,
  // or for its own time when that is longer.
  firstStepDone(turn: string, own: number | undefined, now = Date.now()) {
    const timed = this.turns.get(turn);
    if (timed && timed.firstStepDuration === undefined) {
      timed.firstStepDuration = Math.max(own ?? 0, (now - timed.start) / 1000);
    }
  }

  // How long a turn's first step thought, in seconds. One that arrived done thought until the
  // turn stopped thinking, which with no end yet is the render it arrives in; one that streamed,
  // until `firstStepDone`.
  durationOfFirstStep(turn: string, own: number | undefined, now = Date.now()) {
    const timed = this.turns.get(turn);
    if (!timed) return own;
    if (timed.firstStepDuration !== undefined) return timed.firstStepDuration;
    if (timed.firstStepStreamed) return own;
    return Math.max(own ?? 0, ((timed.end ?? now) - timed.start) / 1000);
  }

  // Whether a turn's first step, which arrived done with the reply that ends the thinking, opens
  // to show its reasoning before it folds and the answer starts. The thinking's end is noted
  // after the render the step arrives in, so no end yet counts as ending now.
  showsFirstStep(turn: string, now = Date.now()) {
    const timed = this.turns.get(turn);
    if (!timed || timed.firstStepStreamed) return false;
    return timed.end === undefined || now - timed.end < ARRIVAL_WINDOW_MS;
  }
}

/** A turn's clock, and the id of its first reasoning step: the one that takes over its thinking. */
export type AIThinkingTurn = {
  clock: AIThinkingClock;
  key: string;
  firstStepId?: string;
};

export const AIThinkingTurnContext = createContext<AIThinkingTurn | undefined>(undefined);

export const useAIThinkingTurn = () => useContext(AIThinkingTurnContext);
