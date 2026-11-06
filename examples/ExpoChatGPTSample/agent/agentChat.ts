import { LiveReasoning, type Session } from '@stream-io/calypso';
import { type Channel, type Event, type LocalMessage, StateStore } from 'stream-chat';

/** How many messages are read at a time. */
const PAGE_SIZE = 30;

export type AgentChatState = {
  /** The channel's messages, oldest first. */
  messages: readonly LocalMessage[];
  /** Whether the channel holds messages older than those loaded. */
  hasOlderMessages: boolean;
  /** Whether the first page of messages is in. A new conversation has none to wait for. */
  isLoaded: boolean;
  /** The session the conversation is held in, once something here needed it. */
  session: Session | undefined;
};

/**
 * Opens a conversation's session: carries on `sessionId`, or starts a new conversation without one.
 */
export type OpenSession = (sessionId: string | undefined) => Promise<Session>;

/**
 * A written conversation as the AI components want it: the messages of the channel the router
 * keeps it in, and the whole of each reply's thinking.
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

  readonly state: StateStore<AgentChatState>;

  private channel: Channel | undefined;
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
  ) {
    this.state = new StateStore<AgentChatState>({
      hasOlderMessages: false,
      isLoaded: sessionId === undefined,
      messages: [],
      session: undefined,
    });
  }

  /** The conversation's session id: the one it was opened with, or the one asking created. */
  get id() {
    return this.state.getLatestValue().session?.id ?? this.sessionId;
  }

  /** Watches the channel and loads its latest messages. */
  async follow(channel: Channel) {
    if (this.channel || this.closed) return;
    this.channel = channel;
    // Every event rather than the list kept for us: each live update carries its own window of the
    // reply's thinking, and folding them into one would lose all but the last.
    const subscription = channel.on((event: Event) => {
      if (event.type === 'message.updated' && event.message) {
        this.reasoning.read(event.message as { id: string; reasoning?: unknown });
      }
      if (
        event.type === 'message.new' ||
        event.type === 'message.updated' ||
        event.type === 'message.deleted'
      ) {
        // A new array, in which only the messages that changed are new objects.
        this.state.partialNext({ messages: [...channel.state.messages] });
      }
    });
    this.stops.push(() => subscription.unsubscribe());

    const recovered = channel
      .getClient()
      .on('connection.recovered', () => void this.watchLatest().catch(() => {}));
    this.stops.push(() => recovered.unsubscribe());

    // A channel this client read before shows what it had at once, while the latest page loads.
    if (channel.state.messages.length > 0) {
      this.state.partialNext({ isLoaded: true, messages: [...channel.state.messages] });
    }
    await this.watchLatest();
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
    const { messages, session } = this.state.getLatestValue();
    if (this.sessionId !== undefined || !session || messages.length > 0) return;
    this.opening = undefined;
    this.state.partialNext({ session: undefined });
    await session.delete().catch(() => {});
  }

  /** Loads the messages before the oldest one loaded. Throws when it can't, to be asked again. */
  loadOlderMessages = async () => {
    const oldest = this.state.getLatestValue().messages[0]?.id;
    if (!oldest || !this.channel) return;
    const page = await this.channel.query({ messages: { id_lt: oldest, limit: PAGE_SIZE } });
    this.state.partialNext({
      hasOlderMessages: page.messages.length >= PAGE_SIZE,
      messages: [...this.channel.state.messages],
    });
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
      await (this.sessionId === undefined ? session.delete() : session.close()).catch(() => {});
      throw new Error('The conversation was closed');
    }
    if (!this.channel) {
      const { channel } = await session.chat();
      await this.follow(channel as Channel);
    }
    this.state.partialNext({ session });
    return session;
  }

  /** Watches the channel again and takes its latest page, in place of what was loaded. */
  private async watchLatest() {
    const channel = this.channel;
    if (!channel) return;
    const watched = await channel.watch({ messages: { limit: PAGE_SIZE } });
    if (this.closed) return;
    this.state.partialNext({
      hasOlderMessages: (watched.messages?.length ?? 0) >= PAGE_SIZE,
      isLoaded: true,
      messages: [...channel.state.messages],
    });
  }
}

/** A reply the agent wrote. */
export const isAgentReply = (message: LocalMessage) => message.ai_generated === true;

/** A reply with nothing to show yet: no text, no steps and no UI. */
export const isEmptyReply = (message: LocalMessage) =>
  !message.text &&
  !message.ai_ui &&
  !(message.attachments ?? []).some(
    (attachment) => attachment.type === 'ai_reasoning' || attachment.type === 'ai_tool_call',
  );
