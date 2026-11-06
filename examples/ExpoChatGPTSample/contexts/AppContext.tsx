import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { type ConversationSnapshot, type Session, type UIAction } from '@stream-io/calypso';
import type { LocalMessage, StreamChat } from 'stream-chat';
import { useStableCallback, useStateStore } from 'stream-chat-expo';
import {
  AIClientIdentity,
  type AIMessageRating,
  type AIPendingMessage,
  type AIToolApprover,
  createAuthSessionAuthorizer,
  parseMessageParts,
} from 'stream-chat-expo/ai-components';

import {
  AgentChat,
  type AgentChatState,
  isAgentReply,
  isEmptyReply,
  type OpenSession,
} from '../agent/agentChat';
import { agents, agentSessions, streamToken } from '../agent/agents';
import { AgentConfig } from '../agent/config';
import { createDeviceTools } from '../agent/deviceTools';
import { toDataUri } from '../agent/photos';

const IDLE: ConversationSnapshot = { kind: 'idle', skills: [] };

// This install, for the tool calls addressed to it.
const clientId = AIClientIdentity.installId();

// The tools this phone runs for the agent, such as telling it the local time.
const deviceTools = createDeviceTools({ clientId, userId: AgentConfig.user.id });

// Where a sign-in comes back to: the app's own scheme, which the web auth session hands back.
// The router takes only https or a native app's own scheme in reverse domain form (RFC 8252).
const SIGN_IN_SCHEME = 'io.getstream.expochatgptsample';
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

// A question on its way: what shows until Stream's copy arrives, and how many of the person's
// messages there were when it was asked, so its copy is the first one after them.
type Asked = { message: AIPendingMessage; after: number };

export type AppContextValue = {
  /** What the agent is doing in the open conversation, from the session's socket. */
  agentState: ConversationSnapshot;
  /** Answers the open conversation's tool calls that ask first. */
  approver: AIToolApprover | undefined;
  /** The open conversation's messages and live reasoning. */
  chat: AgentChat | undefined;
  /** Bumped when the drawer's list of conversations may have changed. */
  conversationsVersion: number;
  /** Why the last conversation couldn't be opened, or what asking failed with. */
  failure: string | undefined;
  /** Whether a question is on its way or being answered, from the first thought to the last word. */
  isBusy: boolean;
  /** Whether the agent is answering and its reply shows nothing yet. */
  isThinking: boolean;
  /** The question on its way, until Stream's copy of it arrives. */
  pending: AIPendingMessage | undefined;
  /** The open conversation's session id, or `undefined` for a new one that wasn't asked anything. */
  sessionId: string | undefined;
  /**
   * Asks the agent, with photos by their local URIs, with more time to reason when
   * `thinkHarder`, and with what the person did in a reply's UI as `uiAction`. Its reply arrives
   * in the channel. Resolves to whether it was asked: not while the agent is busy.
   */
  ask: (
    text: string,
    photos?: string[],
    thinkHarder?: boolean,
    uiAction?: UIAction,
  ) => Promise<boolean>;
  /**
   * Carries on a conversation from the drawer, by its session id. Its messages show as soon as its
   * channel, `type:id` as the router lists it, is read.
   */
  openConversation: (sessionId: string, conversationId?: string) => void;
  /** Rates a reply, or takes the rating back with null. */
  rate: (messageId: string, rating: AIMessageRating | null) => void;
  /** How the person rated replies, by message. Kept for this run only: the router takes no ratings yet. */
  ratings: Readonly<Record<string, AIMessageRating>>;
  /** Starts a new conversation. The router creates it with its first question. */
  startConversation: () => void;
  /** Stops the reply being written. What it wrote so far stays. */
  stop: () => void;
};

export const AppContext = React.createContext<AppContextValue>({
  agentState: IDLE,
  approver: undefined,
  ask: () => Promise.resolve(false),
  chat: undefined,
  conversationsVersion: 0,
  failure: undefined,
  isBusy: false,
  isThinking: false,
  openConversation: () => {},
  pending: undefined,
  rate: () => {},
  ratings: {},
  sessionId: undefined,
  startConversation: () => {},
  stop: () => {},
});

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

const userMessageCount = (messages: readonly LocalMessage[]) =>
  messages.filter((message) => !isAgentReply(message)).length;

// What the provider follows of the messages: what decides whether the agent is thinking or busy,
// and when a question's copy has arrived. And the session, once one is open.
const selector = ({ messages, session }: AgentChatState) => ({
  last: messages[messages.length - 1] as LocalMessage | undefined,
  lastReply: [...messages].reverse().find(isAgentReply),
  session,
  userMessages: userMessageCount(messages),
});

// Carries a conversation on, or creates one, with the phone's tools declared on it.
const openSession: OpenSession = (sessionId) =>
  sessionId
    ? agentSessions().resume(sessionId, { tools: deviceTools.sessionTools() })
    : agentSessions().create({
        modelOverwrites: { llm: AgentConfig.chatModel },
        return_url: SIGN_IN_RETURN_URL,
        tools: deviceTools.sessionTools(),
      });

let chats = 0;
const newChat = (sessionId?: string) => new AgentChat(`chat-${++chats}`, sessionId, openSession);

export const AppProvider = ({ client, children }: PropsWithChildren<{ client: StreamChat }>) => {
  const [chat, setChat] = useState<AgentChat>();
  const [failure, setFailure] = useState<string>();
  const [agentState, setAgentState] = useState<ConversationSnapshot>(IDLE);
  const [conversationsVersion, setConversationsVersion] = useState(0);
  const [ratings, setRatings] = useState<Readonly<Record<string, AIMessageRating>>>({});
  const [asked, setAsked] = useState<Asked>();
  // The newest message when something was last asked here, until it fails or is stopped.
  const [askedAfter, setAskedAfter] = useState<string>();
  const current = useRef<AgentChat | undefined>(undefined);
  const askedRef = useRef<Asked | undefined>(undefined);
  askedRef.current = asked;

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
    current.current = next;
    setAsked(undefined);
    setAskedAfter(undefined);
    setFailure(undefined);
    setChat(next);
    void previous?.close().catch(() => {});
  };

  // A new conversation is only shown: the router creates it with its first question, so one
  // that is never asked anything isn't left in the drawer.
  const startConversation = useStableCallback(() => show(newChat()));

  const openConversation = useStableCallback((sessionId: string, conversationId?: string) => {
    if (sessionId === current.current?.id) {
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
      if (current.current === next) setFailure(messageOf(error));
    });
  });

  const isResponding = agentState.kind === 'responding' || agentState.kind === 'working';
  const isBusy = !!asked || isResponding || followed?.lastReply?.generating === true;

  const ask = useStableCallback(
    async (text: string, photos: string[] = [], thinkHarder = false, uiAction?: UIAction) => {
      const opened = current.current;
      if (!opened || isBusy) {
        return false;
      }
      // Shows at once, with the photos as they were picked.
      const asking: Asked = {
        after: userMessageCount(opened.state.getLatestValue().messages),
        message: {
          attachments: photos.map((url) => ({ kind: 'image', url })),
          id: crypto.randomUUID(),
          text,
        },
      };
      const messages = opened.state.getLatestValue().messages;
      // From now on the conversation is used, even before Stream's copy of the question arrives.
      opened.wasAsked = true;
      setFailure(undefined);
      setAsked(asking);
      setAskedAfter(messages[messages.length - 1]?.id ?? '');
      try {
        // A new conversation is created here, with its first question.
        const wasNew = opened.id === undefined;
        const [session, images] = await Promise.all([
          opened.session(),
          Promise.all(photos.map(async (uri) => ({ url: await toDataUri(uri) }))),
        ]);
        if (wasNew) setConversationsVersion((version) => version + 1);
        await respond(session, text, {
          images,
          reasoningEffort: thinkHarder ? 'high' : undefined,
          uiAction,
        });
        return true;
      } catch (error) {
        // A conversation created for this question, which it never reached, isn't left listed.
        await opened.discardUnusedSession();
        if (current.current !== opened) return false;
        setFailure(messageOf(error));
        setAskedAfter(undefined);
        if (askedRef.current === asking) setAsked(undefined);
        return false;
      }
    },
  );

  // Stream's copy of the question on its way is the person's first message after the ones there
  // were when they asked: once it is in, the question on its way goes.
  useEffect(() => {
    if (asked && followed && followed.userMessages > asked.after) {
      setAsked(undefined);
    }
  }, [asked, followed]);

  const stop = useStableCallback(() => {
    setAskedAfter(undefined);
    // A reply that was being written when the conversation was opened stops through its session,
    // which opens for it.
    void current.current
      ?.session()
      .then((opened) => opened.interrupt())
      .catch(() => {
        // The reply finished first, which is what stopping it was for.
      });
  });

  const rate = useStableCallback((messageId: string, rating: AIMessageRating | null) =>
    setRatings((previous) => {
      const next = { ...previous };
      if (rating) {
        next[messageId] = rating;
      } else {
        delete next[messageId];
      }
      return next;
    }),
  );

  // Whether the agent is answering and its reply shows nothing yet. The session can pass through
  // idle between the question and the first of its reply, which would hide it for a moment.
  const last = followed?.last;
  const replyHasBegun = !!last && isAgentReply(last) && !isEmptyReply(last);
  const isAwaitingReply =
    askedAfter !== undefined &&
    !!last &&
    last.id !== askedAfter &&
    (!isAgentReply(last) || (last.generating === true && !replyHasBegun));
  const isThinking =
    agentState.kind === 'responding'
      ? !replyHasBegun
      : agentState.kind === 'working'
        ? false
        : isAwaitingReply;

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

  // Answers go over the session's socket, which opens for them in a conversation that was only
  // read so far. Each throws when it can't send, so the card lets the person answer again.
  const approver = useMemo<AIToolApprover | undefined>(
    () =>
      chat
        ? {
            authorizer: createAuthSessionAuthorizer({
              callbackScheme: SIGN_IN_SCHEME,
              decline: async (call) => (await chat.session()).declineLogin(call.id),
            }),
            clientId,
            decide: async (call, allowed) => answerApproval(await chat.session(), call.id, allowed),
            userId: AgentConfig.user.id,
          }
        : undefined,
    [chat],
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

  const pending = asked?.message;
  const sessionId = session?.id ?? chat?.id;
  const contextValue = useMemo(
    () => ({
      agentState,
      approver,
      ask,
      chat,
      conversationsVersion,
      failure,
      isBusy,
      isThinking,
      openConversation,
      pending,
      rate,
      ratings,
      sessionId,
      startConversation,
      stop,
    }),
    [
      agentState,
      approver,
      ask,
      chat,
      conversationsVersion,
      failure,
      isBusy,
      isThinking,
      openConversation,
      pending,
      rate,
      ratings,
      sessionId,
      startConversation,
      stop,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
