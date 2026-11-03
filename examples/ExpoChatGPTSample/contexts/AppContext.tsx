import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  type ConversationSnapshot,
  type ImageSource,
  LiveReasoning,
  type Session,
} from '@stream-io/calypso';
import type { Channel, Event, StreamChat } from 'stream-chat';
import { useStableCallback } from 'stream-chat-expo';
import {
  AIClientIdentity,
  type AIToolApprover,
  createAuthSessionAuthorizer,
} from 'stream-chat-expo/ai-components';

import { agents, agentSessions, streamToken } from '../agent/agents';
import { AgentConfig } from '../agent/config';

type Conversation = { channel: Channel; reasoning: LiveReasoning; session: Session };

const IDLE: ConversationSnapshot = { kind: 'idle', skills: [] };

// This install, for the tool calls addressed to it.
const clientId = AIClientIdentity.installId();

// Where a sign-in comes back to: the app's own scheme, which the web auth session hands back.
// The router takes only https or a native app's own scheme in reverse domain form (RFC 8252).
const SIGN_IN_SCHEME = 'io.getstream.expochatgptsample';
const SIGN_IN_RETURN_URL = `${SIGN_IN_SCHEME}://sign-in`;

// The person's "not now" on a sign-in. calypso 0.2.3 has no `declineLogin` yet, so this sends
// the frame Vision-Agents' JS SDK sends for it over the session's socket.
const declineLogin = (session: Session, toolCallId: string) =>
  (session as unknown as { held(): { send(frame: Record<string, unknown>): void } })
    .held()
    .send({ allowed: false, tool_call_id: toolCallId, type: 'tool_approval' });

export type AppContextValue = {
  /** What the agent is doing in the open conversation, from the session's socket. */
  agentState: ConversationSnapshot;
  /** Answers the open conversation's tool calls that ask first. */
  approver: AIToolApprover | undefined;
  /** The channel the router writes the open conversation into. */
  channel: Channel | undefined;
  /** Bumped when the drawer's list of conversations may have changed. */
  conversationsVersion: number;
  /** Why the last conversation couldn't be opened, or what asking failed with. */
  failure: string | undefined;
  /** The open conversation's session id. */
  sessionId: string | undefined;
  /** Asks the agent, with photos as data URIs. Its reply arrives in the channel. */
  ask: (text: string, images?: ImageSource[]) => Promise<void>;
  /** Carries on a conversation from the drawer, by its session id. */
  openConversation: (sessionId: string) => void;
  /** The whole of a reply's reasoning step so far, from its live updates. */
  reasoningText: (messageId: string, stepId: string) => string | undefined;
  /** Bumped as reasoning arrives, so the steps showing it render again. */
  reasoningVersion: number;
  /** Starts a new conversation. */
  startConversation: () => void;
  /** Stops the reply being written. What it wrote so far stays. */
  stop: () => void;
};

export const AppContext = React.createContext<AppContextValue>({
  agentState: IDLE,
  approver: undefined,
  ask: async () => {},
  channel: undefined,
  conversationsVersion: 0,
  failure: undefined,
  openConversation: () => {},
  reasoningText: () => undefined,
  reasoningVersion: 0,
  sessionId: undefined,
  startConversation: () => {},
  stop: () => {},
});

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const AppProvider = ({ client, children }: PropsWithChildren<{ client: StreamChat }>) => {
  const [conversation, setConversation] = useState<Conversation>();
  const [failure, setFailure] = useState<string>();
  const [agentState, setAgentState] = useState<ConversationSnapshot>(IDLE);
  const [reasoningVersion, setReasoningVersion] = useState(0);
  const [conversationsVersion, setConversationsVersion] = useState(0);
  const current = useRef<Conversation | undefined>(undefined);

  // Opening one conversation after another: the newest wins, and one that was never asked
  // anything is deleted rather than left in the drawer.
  const open = useStableCallback(async (opening: () => Promise<Session>) => {
    setFailure(undefined);
    try {
      const session = await opening();
      const { channel } = await session.chat();
      const previous = current.current;
      const next = { channel: channel as Channel, reasoning: new LiveReasoning(), session };
      current.current = next;
      setConversation(next);
      if (previous && previous.session.id !== session.id) {
        const unused = previous.channel.state.messages.length === 0;
        await (unused ? previous.session.delete() : previous.session.close()).catch(() => {});
      }
      setConversationsVersion((version) => version + 1);
    } catch (error) {
      setFailure(messageOf(error));
    }
  });

  const startConversation = useStableCallback(() => {
    void open(() =>
      agentSessions().create({
        modelOverwrites: { llm: AgentConfig.chatModel },
        return_url: SIGN_IN_RETURN_URL,
      }),
    );
  });

  const openConversation = useStableCallback((sessionId: string) => {
    if (sessionId === current.current?.session.id) {
      return;
    }
    void open(() => agentSessions().resume(sessionId));
  });

  const ask = useStableCallback(async (text: string, images: ImageSource[] = []) => {
    const session = current.current?.session;
    if (!session) {
      return;
    }
    setFailure(undefined);
    try {
      await session.responses.create(text, images.length > 0 ? { images } : undefined);
    } catch (error) {
      setFailure(messageOf(error));
    }
  });

  const stop = useStableCallback(() => {
    try {
      current.current?.session.interrupt();
    } catch {
      // The reply finished first, which is what stopping it was for.
    }
  });

  const reasoningText = useStableCallback((messageId: string, stepId: string) =>
    current.current?.reasoning.get(messageId, stepId),
  );

  // The open conversation: what the agent is doing, and every live update's slice of thinking,
  // read from each event rather than the message list, which can fold several into one.
  useEffect(() => {
    if (!conversation) {
      return;
    }
    const { channel, reasoning, session } = conversation;
    setAgentState(session.state.get());
    const stopState = session.state.subscribe(() => {
      const state = session.state.get();
      setAgentState(state);
      // The router titles a conversation as it goes.
      if (state.kind === 'idle') setConversationsVersion((version) => version + 1);
    });
    const subscription = channel.on('message.updated', (event: Event) => {
      if (event.message) {
        reasoning.read(event.message as { id: string; reasoning?: unknown });
        setReasoningVersion((version) => version + 1);
      }
    });
    return () => {
      stopState();
      subscription.unsubscribe();
    };
  }, [conversation]);

  const approver = useMemo<AIToolApprover | undefined>(
    () =>
      conversation
        ? {
            authorizer: createAuthSessionAuthorizer({
              callbackScheme: SIGN_IN_SCHEME,
              decline: (call) =>
                new Promise<void>((resolve) => {
                  declineLogin(conversation.session, call.id);
                  resolve();
                }),
            }),
            clientId,
            // `decide` sends over the session's socket and throws when it can't.
            decide: (call, allowed) =>
              new Promise<void>((resolve) => {
                conversation.session.decide(call.id, { allowed });
                resolve();
              }),
            userId: AgentConfig.user.id,
          }
        : undefined,
    [conversation],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The router and Stream Chat as the same user, on the app's own chat client.
        await agents.setUser(AgentConfig.user, streamToken);
        agents.use({ chat: client });
        if (!cancelled) {
          startConversation();
        }
      } catch (error) {
        setFailure(messageOf(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, startConversation]);

  const contextValue = useMemo(
    () => ({
      agentState,
      approver,
      ask,
      channel: conversation?.channel,
      conversationsVersion,
      failure,
      openConversation,
      reasoningText,
      reasoningVersion,
      sessionId: conversation?.session.id,
      startConversation,
      stop,
    }),
    [
      agentState,
      approver,
      ask,
      conversation,
      conversationsVersion,
      failure,
      openConversation,
      reasoningText,
      reasoningVersion,
      startConversation,
      stop,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
