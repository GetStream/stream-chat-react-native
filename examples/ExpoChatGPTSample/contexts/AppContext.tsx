import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { type ConversationSnapshot, type Session } from '@stream-io/calypso';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';
import { useStableCallback, useStateStore } from 'stream-chat-expo';
import {
  AIClientIdentity,
  type AIMessageRating,
  type AIPendingMessage,
  type AIToolApprover,
  createAuthSessionAuthorizer,
} from 'stream-chat-expo/ai-components';

import { AgentChat, type AgentChatState, isAgentReply, isEmptyReply } from '../agent/agentChat';
import { agents, agentSessions, streamToken } from '../agent/agents';
import { AgentConfig } from '../agent/config';
import { toDataUri } from '../agent/photos';

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
  /** The open conversation's session id. */
  sessionId: string | undefined;
  /**
   * Asks the agent, with photos by their local URIs, and with more time to reason when
   * `thinkHarder`. Its reply arrives in the channel.
   */
  ask: (text: string, photos?: string[], thinkHarder?: boolean) => Promise<void>;
  /** Carries on a conversation from the drawer, by its session id. */
  openConversation: (sessionId: string) => void;
  /** Rates a reply, or takes the rating back with null. */
  rate: (messageId: string, rating: AIMessageRating | null) => void;
  /** How the person rated replies, by message. Kept for this run only: the router takes no ratings yet. */
  ratings: Readonly<Record<string, AIMessageRating>>;
  /** Starts a new conversation. */
  startConversation: () => void;
  /** Stops the reply being written. What it wrote so far stays. */
  stop: () => void;
};

export const AppContext = React.createContext<AppContextValue>({
  agentState: IDLE,
  approver: undefined,
  ask: async () => {},
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
// and when a question's copy has arrived.
const selector = ({ messages }: AgentChatState) => ({
  last: messages[messages.length - 1] as LocalMessage | undefined,
  lastReply: [...messages].reverse().find(isAgentReply),
  userMessages: userMessageCount(messages),
});

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

  // Opening one conversation after another: the newest wins, and one that was never asked
  // anything is deleted rather than left in the drawer.
  const open = useStableCallback(async (opening: () => Promise<Session>) => {
    setFailure(undefined);
    try {
      const session = await opening();
      const { channel } = await session.chat();
      const next = new AgentChat(session, channel as Channel);
      await next.follow();
      const previous = current.current;
      current.current = next;
      setAsked(undefined);
      setAskedAfter(undefined);
      setChat(next);
      if (previous && previous.session.id !== session.id) {
        previous.close();
        const unused = previous.state.getLatestValue().messages.length === 0;
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

  const isResponding = agentState.kind === 'responding' || agentState.kind === 'working';
  const isBusy = !!asked || isResponding || followed?.lastReply?.generating === true;

  const ask = useStableCallback(
    async (text: string, photos: string[] = [], thinkHarder = false) => {
      const opened = current.current;
      if (!opened || isBusy) {
        return;
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
      setFailure(undefined);
      setAsked(asking);
      setAskedAfter(messages[messages.length - 1]?.id ?? '');
      try {
        const images = await Promise.all(
          photos.map(async (uri) => ({ url: await toDataUri(uri) })),
        );
        await opened.session.responses.create(text, {
          ...(images.length > 0 ? { images } : {}),
          ...(thinkHarder ? { reasoningEffort: 'high' } : {}),
        });
      } catch (error) {
        setFailure(messageOf(error));
        setAskedAfter(undefined);
        if (askedRef.current === asking) setAsked(undefined);
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
    try {
      current.current?.session.interrupt();
    } catch {
      // The reply finished first, which is what stopping it was for.
    }
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

  // The open conversation: what the agent is doing, from the session's socket.
  useEffect(() => {
    if (!chat) {
      return;
    }
    const { session } = chat;
    setAgentState(session.state.get());
    return session.state.subscribe(() => {
      const state = session.state.get();
      setAgentState(state);
      // The router titles a conversation as it goes.
      if (state.kind === 'idle') setConversationsVersion((version) => version + 1);
    });
  }, [chat]);

  const approver = useMemo<AIToolApprover | undefined>(
    () =>
      chat
        ? {
            authorizer: createAuthSessionAuthorizer({
              callbackScheme: SIGN_IN_SCHEME,
              decline: (call) =>
                new Promise<void>((resolve) => {
                  declineLogin(chat.session, call.id);
                  resolve();
                }),
            }),
            clientId,
            // `decide` sends over the session's socket and throws when it can't.
            decide: (call, allowed) =>
              new Promise<void>((resolve) => {
                chat.session.decide(call.id, { allowed });
                resolve();
              }),
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
      sessionId: chat?.session.id,
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
      startConversation,
      stop,
    ],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
