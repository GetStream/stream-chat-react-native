import { useStateStore } from '@stream-io/state-store/react-bindings';

import type {
  AIConversationController,
  AIConversationControllerState,
} from './AIConversationController';

import type { AIMessage } from '../types';

/**
 * Follows what `selector` picks of a conversation's state, such as its `status` or `error`: the
 * component renders again when it changes. Keep `selector` outside the component, so it stays the
 * same between renders.
 */
export const useAIConversationState = <
  Message extends AIMessage,
  Selected extends Readonly<Record<string, unknown>>,
>(
  conversation: AIConversationController<Message>,
  selector: (state: AIConversationControllerState<Message>) => Selected,
) => useStateStore(conversation.state, selector);
