import { AIState, AIStates, Channel } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

// Re-export the canonical `AIStates` from the LLC so existing imports keep working
// (`import { AIStates } from '.../AITypingIndicatorView'`).
export { AIStates };

const selector = (state: { aiState: AIState }) => ({ aiState: state.aiState });

/**
 * A hook that returns the current state of the AI.
 * @param {Channel} channel - The channel for which we want to know the AI state.
 * @returns {{ aiState: AIState }} The current AI state for the given channel.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } =>
  useStateStore(channel?.state, selector) ?? { aiState: AIStates.Idle };
