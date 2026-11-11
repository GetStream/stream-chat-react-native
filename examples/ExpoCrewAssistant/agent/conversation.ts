import type { AgentChat, AgentChatState } from '@stream-io/stream-agents/chat';
import type { LocalMessage, StateStore } from 'stream-chat';
import type { AIMessage, AIMessagePartData, AIStreamMessage } from 'stream-chat-expo/ai-components';

import { DISPLAY_TITLES } from './crewTools';

/** A written conversation with the agent, over the messages of the channel it is kept in. */
export type Chat = AgentChat<LocalMessage>;

export type ChatState = AgentChatState<LocalMessage>;

/**
 * The chat's state for `useStateStore`. The SDK's store has the shape of stream-chat's
 * `StateStore` (`getLatestValue` and `subscribeWithSelector`, which is all `useStateStore` calls)
 * without depending on stream-chat, so the type is only told so here.
 */
export const chatStore = (chat: Chat) => chat.state as unknown as StateStore<ChatState>;

let keys = 0;
const chatKeys = new WeakMap<Chat, string>();

/** Tells a conversation apart from the one shown before it, for a React key. */
export const keyOf = (chat: Chat) => {
  let key = chatKeys.get(chat);
  if (!key) {
    key = `chat-${++keys}`;
    chatKeys.set(chat, key);
  }
  return key;
};

/** A reply the agent wrote. */
export const isAgentReply = (message: LocalMessage) => message.ai_generated === true;

/**
 * Calls `used` when a new conversation is used, such as asked something: the router lists it from
 * then on. A first question that never reached the router has its session deleted, and the next
 * one creates another, which is listed in its turn. A conversation carried on is listed already,
 * and isn't waited for. Returns a function that stops waiting.
 */
export const whenUsed = (chat: Chat, used: () => void) => {
  if (chat.id !== undefined) return () => {};
  let listed: string | undefined;
  return chat.state.subscribeWithSelector(
    ({ usedSessionId }) => ({ usedSessionId }),
    ({ usedSessionId }) => {
      if (usedSessionId === undefined || usedSessionId === listed) return;
      listed = usedSessionId;
      used();
    },
  );
};

/**
 * A reply of the agent's that has something to show: the router writes it empty first and fills
 * it in, and the conversation hides it until then.
 */
export const showsAgentReply = (message: LocalMessage) =>
  isAgentReply(message) &&
  (message.generating !== true || !!message.text || (message.attachments?.length ?? 0) > 0);

/**
 * Titles the steps of the backend's tools, which the router shows without one, from
 * `DISPLAY_TITLES`. The same message gives back the same object, as `adapt` does.
 */
export const withTitles = (adapt: (message: AIStreamMessage) => AIMessage) => {
  const titled = new WeakMap<AIMessage, AIMessage>();
  return (message: AIStreamMessage) => {
    const adapted = adapt(message);
    let shown = titled.get(adapted);
    if (!shown) {
      const untitled = (part: AIMessagePartData) =>
        part.toolCall && !part.toolCall.displayTitle && DISPLAY_TITLES[part.toolCall.name];
      shown = adapted.parts?.some(untitled)
        ? {
            ...adapted,
            parts: adapted.parts.map((part) =>
              untitled(part) && part.toolCall
                ? {
                    ...part,
                    toolCall: {
                      ...part.toolCall,
                      displayTitle: DISPLAY_TITLES[part.toolCall.name],
                    },
                  }
                : part,
            ),
          }
        : adapted;
      titled.set(adapted, shown);
    }
    return shown;
  };
};
