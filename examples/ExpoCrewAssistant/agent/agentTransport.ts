import type { ConversationSnapshot, Session, UIAction } from '@stream-io/calypso';
import {
  type AIAgentActivity,
  AIAgentActivityStates,
  type AIConversationTransport,
  createFromStreamMessage,
} from 'stream-chat-expo/ai-components';

import type { AgentChat, AgentChatState } from './agentChat';
import { toDataUri } from './photos';

import { THINK_HARDER } from '../chatOptions';

/** What the person did in a reply's UI, which a request carries in its `custom` data. */
export type AgentRequestCustom = { uiAction?: UIAction };

export type AgentTransportOptions = {
  /** Asks the agent in `session`, with photos as data URIs, a reasoning effort and a UI action. */
  respond: (
    session: Session,
    text: string,
    options: { images: { url: string }[]; reasoningEffort?: string; uiAction?: UIAction },
  ) => Promise<void>;
  /** Called once asking created the conversation, so the drawer lists it. */
  onCreated: () => void;
};

// What the agent is doing, from the session's socket: thinking while it responds, and the skills
// it runs while it works.
const activityOf = (snapshot: ConversationSnapshot): AIAgentActivity | undefined => {
  if (snapshot.kind === 'responding') return { state: AIAgentActivityStates.thinking };
  if (snapshot.kind === 'working') {
    return {
      state: AIAgentActivityStates.checkingExternalSources,
      text: `Working on ${snapshot.skills.map((skill) => skill.replace(/_/g, ' ')).join(' and ')}`,
    };
  }
  return undefined;
};

/**
 * The router's conversation as an `AIConversationController` follows it: the messages of the
 * channel `AgentChat` reads, and what the agent is doing from the session's socket. Asking goes
 * through the session, which records the question in the channel and answers it there. The
 * router has no regenerate or edit of its own: those ask again, as a new question.
 */
export const createAgentTransport = (
  chat: AgentChat,
  { onCreated, respond }: AgentTransportOptions,
): AIConversationTransport => ({
  connect: (feed) => {
    // The same message object for each Stream message that didn't change, so only the messages
    // an update touched render again. The live thinking is read through `chat.reasoning`.
    const fromStreamMessage = createFromStreamMessage({
      reasoningText: (messageId, stepId) => chat.reasoning.get(messageId, stepId),
    });
    let followedSession: Session | undefined;
    let stopFollowingSession: (() => void) | undefined;
    const update = ({ hasOlderMessages, messages, session }: AgentChatState) => {
      feed.updateMessages(messages.map(fromStreamMessage));
      feed.updateHasOlderMessages(hasOlderMessages);
      if (session === followedSession) return;
      stopFollowingSession?.();
      followedSession = session;
      stopFollowingSession = session?.state.subscribe(() =>
        feed.updateActivity(activityOf(session.state.get())),
      );
      if (session) feed.updateActivity(activityOf(session.state.get()));
    };
    update(chat.state.getLatestValue());
    const unsubscribe = chat.state.subscribe(update);
    return () => {
      unsubscribe();
      stopFollowingSession?.();
    };
  },
  loadOlderMessages: () => chat.loadOlderMessages(),
  send: async ({ attachments, chatOption, custom, text }) => {
    // From now on the conversation is used, even before Stream's copy of the question arrives.
    chat.wasAsked = true;
    const photos = attachments
      .filter((asset) => !asset.type || asset.type.startsWith('image'))
      .map((asset) => asset.uri);
    try {
      // A new conversation is created here, with its first question.
      const wasNew = chat.id === undefined;
      const [session, images] = await Promise.all([
        chat.session(),
        Promise.all(photos.map(async (uri) => ({ url: await toDataUri(uri) }))),
      ]);
      if (wasNew) onCreated();
      await respond(session, text, {
        images,
        reasoningEffort: chatOption?.id === THINK_HARDER.id ? 'high' : undefined,
        uiAction: (custom as AgentRequestCustom | undefined)?.uiAction,
      });
    } catch (error) {
      // A conversation created for this question, which it never reached, isn't left listed.
      await chat.discardUnusedSession();
      throw error;
    }
  },
  // A reply that was being written when the conversation was opened stops through its session,
  // which opens for it.
  stop: async () => {
    const session = await chat.session();
    await session.interrupt();
  },
});
