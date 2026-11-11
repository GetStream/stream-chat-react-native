import type { MessagePaginatorState } from 'stream-chat';
import { useStateStore } from 'stream-chat-expo';

import type { AgentChat, AgentChatState } from './agentChat';

const channelSelector = ({ channel }: AgentChatState) => ({ channel });

/**
 * Selects from the messages of `chat`'s channel, as its paginator holds them. `undefined` until the
 * channel is followed. `selector` follows `useStateStore`'s rules: keep it stable.
 */
export const useAgentMessages = <T extends Readonly<Record<string, unknown>>>(
  chat: AgentChat | undefined,
  selector: (state: MessagePaginatorState) => T,
) => {
  const channel = useStateStore(chat?.state, channelSelector)?.channel;
  return useStateStore(channel?.messagePaginator.state, selector);
};

const loadedSelector = ({ items }: MessagePaginatorState) => ({
  isEmpty: !items?.length,
  isLoaded: items !== undefined,
});

/**
 * Whether the conversation's first page is in, and whether it holds no messages. A new
 * conversation has none to wait for.
 */
export const useAgentChatLoaded = (chat: AgentChat) =>
  useAgentMessages(chat, loadedSelector) ?? { isEmpty: chat.isNew, isLoaded: chat.isNew };
