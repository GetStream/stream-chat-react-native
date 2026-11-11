import { LiveReasoning, type Session } from '@stream-io/calypso';
import { StateStore } from '@stream-io/state-store';
import type { Channel, Event, LocalMessage } from 'stream-chat';

/** How many messages are read at a time. */
const PAGE_SIZE = 30;

export type AgentChatState = {
  /**
   * The channel the router keeps the conversation in, once it is followed. Its `messagePaginator`
   * holds the messages.
   */
  channel: Channel | undefined;
  /** The session the conversation is held in, once something here needed it. */
  session: Session | undefined;
};

/**
 * Opens a conversation's session: carries on `sessionId`, or starts a new conversation without one.
 */
export type OpenSession = (sessionId: string | undefined) => Promise<Session>;

/**
 * A written conversation as the AI components want it: the channel the router keeps it in, and the
 * whole of each reply's thinking.
 *
 * The router writes everything there. Asking goes through the session, which records the question
 * in the channel and answers it there: the reply's text, and its steps (each round of reasoning and
 * each tool call) as attachments.
 *
 * The channel and the session open apart. Reading a conversation needs only its channel, which
 * Stream serves in a fraction of the time the session takes to come back, and carrying a session
 * on marks the conversation active, which moves it up the router's list. So the session opens only
 * once something needs it, such as a question, and a new conversation has none until it is asked
 * something: the router never lists one that was only looked at.
 */
export class AgentChat {
  /** Each reply's thinking in full, from its live updates. A stored step only keeps its opening. */
  readonly reasoning = new LiveReasoning();

  /** Whether the person asked something here, which may not have arrived in `messages` yet. */
  wasAsked = false;

  readonly state = new StateStore<AgentChatState>({ channel: undefined, session: undefined });

  private stops: (() => void)[] = [];
  private opening: Promise<Session> | undefined;
  private closed = false;

  /**
   * @param key Tells this conversation apart from the one shown before it, such as for a React key.
   * @param sessionId The conversation's session, or `undefined` for a new conversation.
   */
  constructor(
    readonly key: string,
    private readonly sessionId: string | undefined,
    private readonly openSession: OpenSession,
  ) {}

  /** The conversation's session id: the one it was opened with, or the one asking created. */
  get id() {
    return this.state.getLatestValue().session?.id ?? this.sessionId;
  }

  /** Whether this is a new conversation, which has no messages to wait for. */
  get isNew() {
    return this.sessionId === undefined;
  }

  /** The messages loaded, oldest first. */
  get messages(): readonly LocalMessage[] {
    return this.state.getLatestValue().channel?.messagePaginator.state.getLatestValue().items ?? [];
  }

  /**
   * Watches the channel and loads its latest messages, as the chat SDK's `<Channel>` does. While it
   * is followed the channel is active, so the client reloads it after a reconnect.
   */
  async follow(channel: Channel) {
    if (this.state.getLatestValue().channel || this.closed) return;
    // Every event rather than the paginator's messages: each live update carries its own window of
    // the reply's thinking, and folding them into one would lose all but the last.
    const subscription = channel.on((event: Event) => {
      if (event.type === 'message.updated' && event.message) this.reasoning.read(event.message);
    });
    this.stops.push(() => subscription.unsubscribe(), channel.activate());
    this.state.partialNext({ channel });

    const paginator = channel.messagePaginator;
    paginator.pageSize = PAGE_SIZE;
    await channel.watch();
    if (!paginator.state.getLatestValue().items?.length) await paginator.reload();
  }

  /**
   * The conversation's session, opened the first time it is needed. A new conversation is created
   * then, and its channel followed. Rejects when it can't open, to be asked again.
   */
  session(): Promise<Session> {
    this.opening ??= this.open().catch((error: unknown) => {
      this.opening = undefined;
      throw error;
    });
    return this.opening;
  }

  /**
   * Deletes the session a new conversation was given when the question that created it failed
   * before anything was written, so the router doesn't list an empty conversation. The next
   * question creates another.
   */
  async discardUnusedSession() {
    const { session } = this.state.getLatestValue();
    if (!this.isNew || !session || this.messages.length > 0) return;
    this.opening = undefined;
    this.state.partialNext({ session: undefined });
    await session.delete().catch(() => {});
  }

  /** Loads the messages before the oldest one loaded. Throws when it can't, to be asked again. */
  loadOlderMessages = async () => {
    const paginator = this.state.getLatestValue().channel?.messagePaginator;
    if (!paginator?.hasMoreTail) return;
    await paginator.toTail();
    // The paginator keeps a failure rather than throwing it.
    if (paginator.lastQueryError) throw paginator.lastQueryError;
  };

  /** Stops following the channel, and lets the session go. */
  async close() {
    this.closed = true;
    for (const stop of this.stops.splice(0)) stop();
    const opened = await this.opening?.catch(() => undefined);
    await opened?.close();
  }

  private async open() {
    const session = await this.openSession(this.sessionId);
    if (this.closed) {
      // The person moved on while it opened. A conversation created for them was never used.
      await (this.isNew ? session.delete() : session.close()).catch(() => {});
      throw new Error('The conversation was closed');
    }
    if (!this.state.getLatestValue().channel) {
      const { channel } = await session.chat();
      await this.follow(channel as Channel);
    }
    this.state.partialNext({ session });
    return session;
  }
}

/** A reply the agent wrote. */
export const isAgentReply = (message: LocalMessage) => message.custom?.ai_generated === true;
