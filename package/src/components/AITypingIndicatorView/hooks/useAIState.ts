import { AIState, AIStates, Channel } from 'stream-chat';

import { useStateStore } from '../../../hooks/useStateStore';

// Re-exports `AIStates` from `stream-chat` so it can be imported from this module.
export { AIStates };

const selector = (state: { aiState: AIState }) => ({ aiState: state.aiState });

/**
 * Returns the AI state of `channel`, or the idle state when there is no channel state.
 *
 * @param channel The channel to read the AI state of.
 * @returns The current AI state.
 */
export const useAIState = (channel?: Channel): { aiState: AIState } =>
  useStateStore(channel?.state, selector) ?? { aiState: AIStates.Idle };
