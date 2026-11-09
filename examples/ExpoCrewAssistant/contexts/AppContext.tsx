import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { type ConversationSnapshot, type Session, type UIAction } from '@stream-io/calypso';
import type { StreamChat } from 'stream-chat';
import { useStableCallback, useStateStore } from 'stream-chat-expo';
import {
  AIClientIdentity,
  AIConversationController,
  type AIToolApprover,
  createAuthSessionAuthorizer,
  parseMessageParts,
} from 'stream-chat-expo/ai-components';

import { AgentChat, type AgentChatState, isAgentReply, type OpenSession } from '../agent/agentChat';
import { agents, agentSessions, streamToken } from '../agent/agents';
import { createAgentTransport } from '../agent/agentTransport';
import { AgentConfig } from '../agent/config';
import { createDeviceTools } from '../agent/deviceTools';

const IDLE: ConversationSnapshot = { kind: 'idle', skills: [] };

// This install, for the tool calls addressed to it.
const clientId = AIClientIdentity.installId();

// The tools this phone runs for the agent, such as telling it the local time.
const deviceTools = createDeviceTools({ clientId, userId: AgentConfig.user.id });

// Where a sign-in comes back to: the app's own scheme, which the web auth session hands back.
// The router takes only https or a native app's own scheme in reverse domain form (RFC 8252).
const SIGN_IN_SCHEME = 'io.getstream.expocrewassistant';
const SIGN_IN_RETURN_URL = `${SIGN_IN_SCHEME}://sign-in`;

// The person's answer to a call that asks first. calypso's `decide` answers only a call this
// session was asked on its own socket, and leaves any other alone, so a question shown from the
// channel, as after reopening the conversation or reloading the app, would wait forever. Such a
// call is answered with the frames `decide` sends, which the router matches by the call's id: an
// allowed client tool's call then waits for this phone, whose runner runs it.
const answerApproval = (session: Session, toolCallId: string, allowed: boolean) => {
  if (session.approvals.some((request) => request.id === toolCallId)) {
    session.decide(toolCallId, { allowed });
    return;
  }
  const socket = (
    session as unknown as { held(): { send(frame: Record<string, unknown>): void } }
  ).held();
  socket.send({ allowed, tool_call_id: toolCallId, type: 'tool_approval' });
  if (!allowed) {
    socket.send({
      error: 'The person declined this call.',
      tool_call_id: toolCallId,
      type: 'tool_result',
    });
  }
};

// Asks, with calypso's `responses.create`, which takes photos, a reasoning effort and what the
// person did in a reply's UI. The router's `respond`, which addresses a client tool's call to the
// install a question came from, is only for an app's backend, and this is a phone: the calls reach
// the device's tools without an install, and the phone runs them itself.
const respond = async (
  session: Session,
  text: string,
  options: { images: { url: string }[]; reasoningEffort?: string; uiAction?: UIAction },
) => {
  deviceTools.addressed = false;
  await session.responses.create(text, {
    ...(options.images.length > 0 ? { images: options.images } : {}),
    ...(options.reasoningEffort ? { reasoningEffort: options.reasoningEffort } : {}),
    ...(options.uiAction ? { uiAction: options.uiAction } : {}),
  });
};

// Answers go over the session's socket, which opens for them in a conversation that was only
// read so far. Each throws when it can't send, so the card lets the person answer again.
const approverFor = (chat: AgentChat): AIToolApprover => ({
  authorizer: createAuthSessionAuthorizer({
    callbackScheme: SIGN_IN_SCHEME,
    decline: async (call) => (await chat.session()).declineLogin(call.id),
  }),
  clientId,
  decide: async (call, allowed) => answerApproval(await chat.session(), call.id, allowed),
  userId: AgentConfig.user.id,
});

export type AppContextValue = {
  /** What the agent is doing in the open conversation, from the session's socket. */
  agentState: ConversationSnapshot;
  /** The open conversation's messages and live reasoning. */
  chat: AgentChat | undefined;
  /** The open conversation's state, and what the person does in it. */
  conversation: AIConversationController | undefined;
  /** Bumped when the drawer's list of conversations may have changed. */
  conversationsVersion: number;
  /** Why the last conversation couldn't be opened. */
  failure: string | undefined;
  /** The open conversation's session id, or `undefined` for a new one that wasn't asked anything. */
  sessionId: string | undefined;
  /**
   * Carries on a conversation from the drawer, by its session id. Its messages show as soon as its
   * channel, `type:id` as the router lists it, is read.
   */
  openConversation: (sessionId: string, conversationId?: string) => void;
  /** Starts a new conversation. The router creates it with its first question. */
  startConversation: () => void;
};

export const AppContext = React.createContext<AppContextValue>({
  agentState: IDLE,
  chat: undefined,
  conversation: undefined,
  conversationsVersion: 0,
  failure: undefined,
  openConversation: () => {},
  sessionId: undefined,
  startConversation: () => {},
});

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

// What the provider follows of the messages: the latest reply, whose calls this phone runs, and
// the session, once one is open.
const selector = ({ messages, session }: AgentChatState) => ({
  lastReply: [...messages].reverse().find(isAgentReply),
  session,
});

// Carries a conversation on, or creates one, with the phone's tools declared on it.
const openSession: OpenSession = (sessionId) =>
  sessionId
    ? agentSessions().resume(sessionId, { tools: deviceTools.sessionTools() })
    : agentSessions().create({
        return_url: SIGN_IN_RETURN_URL,
        tools: deviceTools.sessionTools(),
      });

let chats = 0;
const newChat = (sessionId?: string) => new AgentChat(`chat-${++chats}`, sessionId, openSession);

type Opened = { chat: AgentChat; conversation: AIConversationController };

export const AppProvider = ({ client, children }: PropsWithChildren<{ client: StreamChat }>) => {
  const [opened, setOpened] = useState<Opened>();
  const [failure, setFailure] = useState<string>();
  const [agentState, setAgentState] = useState<ConversationSnapshot>(IDLE);
  const [conversationsVersion, setConversationsVersion] = useState(0);
  const current = useRef<Opened | undefined>(undefined);
  const chat = opened?.chat;

  const followed = useStateStore(chat?.state, selector);
  const session = followed?.session;

  // Runs the calls of the latest reply that wait for this phone, each once.
  const lastReply = followed?.lastReply;
  useEffect(() => {
    if (!lastReply) return;
    deviceTools.runner.run(parseMessageParts(lastReply.attachments), (call, result) =>
      deviceTools.send(call.id, result),
    );
  }, [lastReply]);

  // Shows a conversation in place of the one before it, at once, and lets the one before go.
  const show = (next: AgentChat) => {
    const previous = current.current;
    const conversation = new AIConversationController({
      approver: approverFor(next),
      transport: createAgentTransport(next, {
        onCreated: () => setConversationsVersion((version) => version + 1),
        respond,
      }),
    });
    current.current = { chat: next, conversation };
    setFailure(undefined);
    setOpened(current.current);
    previous?.conversation.dispose();
    void previous?.chat.close().catch(() => {});
  };

  // A new conversation is only shown: the router creates it with its first question, so one
  // that is never asked anything isn't left in the drawer.
  const startConversation = useStableCallback(() => show(newChat()));

  const openConversation = useStableCallback((sessionId: string, conversationId?: string) => {
    if (sessionId === current.current?.chat.id) {
      return;
    }
    const next = newChat(sessionId);
    show(next);
    // The channel, when the drawer named it: reading it is quick, and carrying the session on,
    // which waits for something to need it, would also mark the conversation active.
    const [type, ...id] = (conversationId ?? '').split(':');
    const following = conversationId
      ? next.follow(client.channel(type || 'agent', id.join(':')))
      : next.session();
    void following.catch((error: unknown) => {
      if (current.current?.chat === next) setFailure(messageOf(error));
    });
  });

  // The open conversation: what the agent is doing, from the session's socket, once one is open.
  useEffect(() => {
    if (!session) {
      setAgentState(IDLE);
      return;
    }
    setAgentState(session.state.get());
    return session.state.subscribe(() => {
      const state = session.state.get();
      setAgentState(state);
      // The router titles a conversation as it goes.
      if (state.kind === 'idle') setConversationsVersion((version) => version + 1);
    });
  }, [session]);

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

  const sessionId = session?.id ?? chat?.id;
  const conversation = opened?.conversation;
  const contextValue = useMemo(
    () => ({
      agentState,
      chat,
      conversation,
      conversationsVersion,
      failure,
      openConversation,
      sessionId,
      startConversation,
    }),
    [
      agentState,
      chat,
      conversation,
      conversationsVersion,
      failure,
      openConversation,
      sessionId,
      startConversation,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
