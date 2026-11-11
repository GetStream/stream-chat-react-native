import { StateStore } from '@stream-io/state-store';

import { AIAgentError } from './AIAgentError';
import { AIConversationExchange, hasEmptyContent } from './AIConversationExchange';
import { editActionOf, latestUserMessageIdOf, replyActionsOf } from './offers';
import {
  type AIAgentActivity,
  AIAgentActivityStates,
  type AIConversationActions,
  type AIConversationFeed,
  type AIConversationRequest,
  type AIConversationStatus,
  type AIConversationTransport,
  isAIConversationAnswering,
} from './types';

import { generateUUIDv4 } from '../../internal/uuid';
import type { AIMessageRating, AIReplyActionsProps } from '../../message/AIReplyActions';
import type { AIChatOption } from '../../message-composer/ChatOptions';
import type { MediaAsset } from '../../services/media-picker-service/AbstractMediaPickerService';
import { type ComposerState, createNewComposerStore } from '../../store/composer/store';
import type { AIToolApprover } from '../../tool-calls/AIToolApprover';
import type { AIMessage, AIPendingMessage } from '../types';

export type AIConversationControllerState<Message extends AIMessage = AIMessage> = {
  /** The conversation as it shows, oldest message first. */
  messages: readonly Message[];
  /**
   * The message the person sent last that is not in the conversation yet. It stays until its
   * reply starts, and after it was stopped or failed, while `retry()` can send it again.
   */
  pendingMessage: AIPendingMessage | undefined;
  /** Where the latest exchange with the agent is. */
  status: AIConversationStatus;
  /**
   * Why the latest request failed, or, as an `AIAgentError`, what the agent said when it couldn't
   * answer or that it didn't answer in time. It stays until the next request, or until a reply
   * starts after all.
   */
  error: Error | undefined;
  /** What the agent says it is doing besides what its reply shows, such as checking sources. */
  activity: AIAgentActivity | undefined;
  /** Whether the conversation has messages before the first one, which `loadOlderMessages` loads. */
  hasOlderMessages: boolean;
  /**
   * How the person rated replies, by the reply's id: the rating they gave on this device, or else
   * the reply's own `rating`.
   */
  ratings: Readonly<Record<string, AIMessageRating>>;
};

export type AIConversationControllerOptions<Message extends AIMessage = AIMessage> = {
  /** How the conversation reaches the agent and learns what it holds. Connected straight away. */
  transport: AIConversationTransport<Message>;
  /** What the conversation's views offer. All of them by default. */
  actions?: AIConversationActions;
  /** Who answers tool calls' questions and sign-ins on this device, which the conversation asks them. */
  approver?: AIToolApprover;
  /** What the person writes, such as a store the app fills itself. A new one by default. */
  composer?: StateStore<ComposerState>;
  /**
   * How many milliseconds the controller waits, once the agent has the request, for the agent to
   * start its reply or say what it is doing, before it shows an `AIAgentError`. While the agent
   * says it is working, such as thinking, it waits as long as that takes. Five minutes by default;
   * `null` or `Infinity` waits as long as it takes.
   */
  replyTimeout?: number | null;
};

/** What the person sends: what `ComposerView` hands on. */
export type AIConversationSendData = {
  text: string;
  /** The files the person picked, on this device. */
  attachments?: MediaAsset[];
  /** The option the person picked in the composer. */
  chatOption?: AIChatOption;
  custom?: Record<string, unknown>;
};

const DEFAULT_REPLY_TIMEOUT = 5 * 60 * 1000;
// The longest `setTimeout` waits; anything longer waits as long as it takes.
const MAX_TIMEOUT = 2 ** 31 - 1;

const ALL_ACTIONS: Required<AIConversationActions> = { edit: true, rate: true, regenerate: true };

const isAbortError = (error: unknown) =>
  (error as { name?: unknown } | null)?.name === 'AbortError';

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

const sameItems = <T>(a: readonly T[], b: readonly T[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

const sameRatings = (
  a: Readonly<Record<string, AIMessageRating>>,
  b: Readonly<Record<string, AIMessageRating>>,
) => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
};

// A rating the person gave a reply on this device, shown in place of the reply's own.
type RatingChange = {
  shown: AIMessageRating | null;
  // What the transport has, which the rating goes back to when it can't take a new one.
  sent: AIMessageRating | null;
  // Tells the latest rating of the reply apart from those before it.
  attempt: number;
  // Sends the latest rating, after those before it.
  sending?: Promise<void>;
};

/**
 * The state behind an AI conversation, and what the person does in it.
 *
 * It holds the conversation's messages, where the latest exchange with the agent is and why it
 * failed, and it sends what the person asks through its `AIConversationTransport`. Give it to
 * `AIConversation` and `ComposerView` as `conversation`, which show it and act on it: sending,
 * stopping, regenerating and rating replies, and editing the person's latest message.
 *
 * ```tsx
 * const [conversation] = useState(() => new AIConversationController({ transport }));
 * useEffect(() => () => conversation.dispose(), [conversation]);
 *
 * <AIConversation conversation={conversation} />
 * <ComposerView conversation={conversation} />
 * ```
 *
 * What the person sends shows straight away, and the agent thinks until its reply starts. While
 * a reply is written again, or a message the person edited is answered again, the messages it
 * replaces are left out of `messages` until the new reply starts.
 */
export class AIConversationController<Message extends AIMessage = AIMessage> {
  /** The conversation's state, to follow with `useStateStore`. */
  readonly state: StateStore<AIConversationControllerState<Message>>;
  /** What the person is writing: `ComposerView` shows it, and editing a message fills it. */
  readonly composer: StateStore<ComposerState>;
  /** Who answers tool calls' questions and sign-ins on this device. */
  readonly approver: AIToolApprover | undefined;
  /** What the conversation's views offer the person to do with its messages. */
  readonly actions: Required<AIConversationActions>;

  private readonly transport: AIConversationTransport<Message>;
  private readonly replyTimeout: number | null;
  private readonly disconnect: (() => void) | undefined;
  private disposed = false;
  // The messages as the transport last told them, including those left out of `messages`.
  private received: readonly Message[] = [];
  // The latest request, until its reply starts or another request takes its place.
  private exchange: AIConversationExchange<Message> | undefined;
  // Counts the requests and stops, so the outcome of one that was overtaken is ignored.
  private generation = 0;
  // Replies stopped while they were written, which are finished whatever they say.
  private stopped = new Set<string>();
  private activity: AIAgentActivity | undefined;
  // Whether what the agent says it is doing is ignored, after it was stopped, until it stops
  // saying anything.
  private ignoresActivity = false;
  private error: Error | undefined;
  private hasOlderMessages = false;
  // The latest stop, which the next request waits for: the agent would stop that one too.
  private stopping: Promise<void> | undefined;
  // Ends the wait for the latest request's reply when the agent says nothing for too long.
  private replyTimer: ReturnType<typeof setTimeout> | undefined;
  private edited: Message | undefined;
  private ratingChanges = new Map<string, RatingChange>();
  private ratingAttempts = 0;
  private isLoadingOlderMessages = false;

  constructor({
    actions,
    approver,
    composer,
    replyTimeout = DEFAULT_REPLY_TIMEOUT,
    transport,
  }: AIConversationControllerOptions<Message>) {
    this.transport = transport;
    this.composer = composer ?? createNewComposerStore();
    this.approver = approver;
    this.actions = { ...ALL_ACTIONS, ...actions };
    this.replyTimeout = replyTimeout;
    this.state = new StateStore<AIConversationControllerState<Message>>({
      activity: undefined,
      error: undefined,
      hasOlderMessages: false,
      messages: [],
      pendingMessage: undefined,
      ratings: {},
      status: 'ready',
    });
    const disconnect = transport.connect(this.makeFeed());
    this.disconnect = typeof disconnect === 'function' ? disconnect : undefined;
  }

  /**
   * The person's message they are editing in the composer, which the next message they send
   * replaces. The composer shows that they are editing it, with a button that cancels it.
   */
  get editingMessage() {
    return this.composer.getLatestValue().isEditing ? this.edited : undefined;
  }

  /** Stops following the transport and lets go of what is on its way. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.clearReplyTimer();
    this.disconnect?.();
  }

  // What the person does

  /** Sends a message, or the person's edit of the message they are editing. */
  send({ attachments = [], chatOption, custom, text }: AIConversationSendData) {
    if (text.trim() === '' && attachments.length === 0) return;
    const editing = this.editingMessage;
    this.edited = undefined;
    if (this.composer.getLatestValue().isEditing) this.composer.partialNext({ isEditing: false });
    this.start({
      attachments,
      chatOption,
      custom,
      kind: editing ? 'edit' : 'message',
      message: editing,
      messageId: generateUUIDv4(),
      text,
    });
  }

  /**
   * Stops the reply the agent is writing. What it wrote so far stays. When the reply hasn't
   * started yet, the person's message stays, and a reply that still arrives is finished whatever
   * it says.
   */
  stop() {
    if (!isAIConversationAnswering(this.state.getLatestValue().status)) return;
    const id = ++this.generation;
    this.activity = undefined;
    this.ignoresActivity = true;
    if (this.exchange?.state === 'waiting') this.exchange.state = 'stopped';
    const writing = this.writingReply;
    if (writing) this.stopped.add(writing);
    this.refresh();
    this.stopping = (async () => {
      try {
        await this.transport.stop();
      } catch (error) {
        this.stopFailed(id, writing, error);
      }
    })();
  }

  /** Asks the agent for a new reply in place of `reply`, and of those after it. */
  regenerate(reply: Message) {
    const index = this.indexOf(reply);
    if (index < 0 || this.received[index].role === 'user') return;
    this.start(this.regenerateRequest(index));
  }

  /** Puts a message of the person's in the composer to edit. The next message they send replaces it. */
  edit(message: Message) {
    if (message.role !== 'user') return;
    this.edited = message;
    this.composer.partialNext({ isEditing: true, text: message.text });
  }

  /** Stops editing a message, and empties the composer. */
  cancelEditing() {
    if (!this.editingMessage) return;
    this.edited = undefined;
    this.composer.partialNext({ isEditing: false, text: '' });
  }

  /**
   * Tries again after `error`: sends the request that failed again, with the same message id, or
   * asks the agent again for the reply it couldn't write.
   */
  retry() {
    const { exchange } = this;
    if (!exchange?.hasFailed) return;
    this.start(exchange.retryRequest(this.received));
  }

  /** Forgets `error`, and the request that failed. */
  clearError() {
    this.error = undefined;
    if (this.exchange?.hasFailed) this.exchange = undefined;
    this.refresh();
  }

  /**
   * Rates a reply, or takes the rating back with `null`. Ratings reach the transport in the order
   * the person gives them, and the reply's rating goes back to the one the transport has if it
   * can't take the new one.
   */
  rate(reply: Message, rating: AIMessageRating | null) {
    const current = this.state.getLatestValue().ratings[reply.id] ?? null;
    if (current === rating) return;
    const attempt = ++this.ratingAttempts;
    const change = this.ratingChanges.get(reply.id) ?? {
      attempt: 0,
      sent: current,
      shown: current,
    };
    const earlier = change.sending;
    change.shown = rating;
    change.attempt = attempt;
    change.sending = (async () => {
      await earlier;
      await this.sendRating(rating, reply, attempt);
    })();
    this.ratingChanges.set(reply.id, change);
    this.refresh();
  }

  /**
   * Loads the messages before the first one, while there are any. Rejects when they couldn't load,
   * so the conversation waits before it asks again.
   */
  loadOlderMessages = async () => {
    if (!this.hasOlderMessages || this.isLoadingOlderMessages) return;
    this.isLoadingOlderMessages = true;
    try {
      await this.transport.loadOlderMessages?.();
    } finally {
      this.isLoadingOlderMessages = false;
    }
  };

  // What the conversation's views offer

  /**
   * What the person can do with a finished reply: rate it, and write it again while it is the
   * latest and the agent isn't answering.
   */
  replyActions(reply: Message, isLatestReply: boolean): Omit<AIReplyActionsProps, 'text'> {
    return replyActionsOf(this, this.state.getLatestValue(), reply, isLatestReply);
  }

  /** Edits a message of the person's, when it is their latest and the agent isn't answering. */
  editAction(message: Message): (() => void) | undefined {
    const { messages, status } = this.state.getLatestValue();
    return editActionOf(
      this,
      { latestUserMessageId: latestUserMessageIdOf(messages), status },
      message,
    );
  }

  // What the transport says

  private makeFeed(): AIConversationFeed<Message> {
    const isDisposed = () => this.disposed;
    return {
      get isConnected() {
        return !isDisposed();
      },
      updateActivity: (activity) => {
        if (!this.disposed) this.receiveActivity(activity);
      },
      updateHasOlderMessages: (hasOlderMessages) => {
        if (this.disposed || this.hasOlderMessages === hasOlderMessages) return;
        this.hasOlderMessages = hasOlderMessages;
        this.refresh();
      },
      updateMessages: (messages) => {
        if (!this.disposed) this.receiveMessages(messages);
      },
    };
  }

  private receiveMessages(messages: readonly Message[]) {
    this.received = messages;
    const { exchange } = this;
    const reply = exchange?.reply(messages);
    if (exchange && reply) this.receiveReply(reply, exchange);
    this.refresh();
  }

  private receiveActivity(activity: AIAgentActivity | undefined) {
    if (!activity) {
      this.ignoresActivity = false;
      this.activity = undefined;
      // The agent stopped saying it is working without starting its reply.
      if (this.exchange?.state === 'waiting') this.waitForReply(this.exchange.id);
      this.refresh();
      return;
    }
    if (this.ignoresActivity) return;
    this.activity = activity;
    if (activity.state === AIAgentActivityStates.error) {
      this.agentCouldNotAnswer(new AIAgentError(activity.text));
    } else {
      // The agent is working on it, however long it thinks.
      this.clearReplyTimer();
    }
    this.refresh();
  }

  // Private

  private start(request: AIConversationRequest<Message>) {
    const id = ++this.generation;
    this.error = undefined;
    this.activity = undefined;
    this.ignoresActivity = false;
    this.stopped = new Set();
    this.clearReplyTimer();
    this.exchange = new AIConversationExchange(id, request, this.received);
    this.refresh();
    const previousStop = this.stopping;
    void (async () => {
      // The agent would stop a request that reaches it before the stop made before it.
      await previousStop;
      if (this.disposed) return;
      try {
        await this.transport.send(request);
        this.requestSent(id);
      } catch (error) {
        this.requestFailed(id, error);
      }
    })();
  }

  // The reply to the latest request arrived: once it shows something, or as soon as it arrives
  // after the person stopped the request.
  private receiveReply(reply: Message, exchange: AIConversationExchange<Message>) {
    if (exchange.state === 'stopped') {
      if (reply.isGenerating) this.stopped.add(reply.id);
      this.exchange = undefined;
    } else if (!hasEmptyContent(reply) || !reply.isGenerating) {
      this.exchange = undefined;
      this.clearReplyTimer();
      if (exchange.hasFailed) {
        // The agent answered after all.
        this.error = undefined;
        this.stopped.delete(reply.id);
      }
    }
  }

  private requestSent(id: number) {
    const { exchange } = this;
    // The agent may already say it is working on it.
    if (this.disposed || exchange?.id !== id || exchange.state !== 'waiting' || this.activity) {
      return;
    }
    this.waitForReply(id);
  }

  private requestFailed(id: number, error: unknown) {
    const { exchange } = this;
    // Its reply started, so the agent had it, another request took its place, or it already
    // failed.
    if (this.disposed || exchange?.id !== id || exchange.hasFailed) return;
    if (isAbortError(error)) {
      this.exchange = undefined;
    } else {
      exchange.state = 'failed';
      this.error = asError(error);
    }
    this.refresh();
  }

  // The agent goes on answering, and the composer offers to stop it again.
  private stopFailed(id: number, writing: string | undefined, error: unknown) {
    if (this.disposed || id !== this.generation || isAbortError(error)) return;
    if (writing) this.stopped.delete(writing);
    const { exchange } = this;
    if (exchange?.state === 'stopped') {
      exchange.state = 'waiting';
      this.waitForReply(exchange.id);
    }
    this.ignoresActivity = false;
    this.refresh();
  }

  // The agent couldn't answer the latest request, or the latest message: what it was writing is
  // finished, and `retry()` asks it again.
  private agentCouldNotAnswer(error: AIAgentError) {
    const writing = this.writingReply;
    if (writing) this.stopped.add(writing);
    const request = this.exchange ? undefined : this.answerAgainRequest;
    if (request) {
      this.exchange = new AIConversationExchange(++this.generation, request, this.received);
    }
    if (this.exchange) this.exchange.state = 'unanswered';
    this.clearReplyTimer();
    this.error = error;
  }

  private waitForReply(id: number) {
    this.clearReplyTimer();
    const timeout = this.replyTimeout;
    if (timeout === null || !Number.isFinite(timeout) || timeout > MAX_TIMEOUT) return;
    this.replyTimer = setTimeout(() => this.replyTimedOut(id), Math.max(timeout, 0));
  }

  private clearReplyTimer() {
    if (this.replyTimer !== undefined) clearTimeout(this.replyTimer);
    this.replyTimer = undefined;
  }

  private replyTimedOut(id: number) {
    this.replyTimer = undefined;
    const { exchange } = this;
    if (this.disposed || exchange?.id !== id || exchange.state !== 'waiting') return;
    this.agentCouldNotAnswer(new AIAgentError());
    this.refresh();
  }

  // Sends the latest rating of a reply. Those it replaced while one was on its way aren't.
  private async sendRating(rating: AIMessageRating | null, reply: Message, attempt: number) {
    if (this.disposed || this.ratingChanges.get(reply.id)?.attempt !== attempt) return;
    try {
      await this.transport.rate?.(reply, rating);
      const change = this.ratingChanges.get(reply.id);
      if (change) change.sent = rating;
    } catch {
      const change = this.ratingChanges.get(reply.id);
      if (this.disposed || !change || change.attempt !== attempt) return;
      change.shown = change.sent;
      this.refresh();
    }
  }

  // Asks for a new reply in place of the one at `index`, to the person's message before it.
  private regenerateRequest(index: number): AIConversationRequest<Message> {
    const prompt = this.received
      .slice(0, index)
      .reverse()
      .find((message) => message.role === 'user');
    return {
      attachments: [],
      kind: 'regenerate',
      message: this.received[index],
      messageId: generateUUIDv4(),
      text: prompt?.text ?? '',
    };
  }

  // Asks again for the latest message's reply: the reply written again, or one to the person's
  // message, which has none.
  private get answerAgainRequest(): AIConversationRequest<Message> | undefined {
    const last = this.received.length - 1;
    if (last < 0) return undefined;
    if (this.received[last].role !== 'user') return this.regenerateRequest(last);
    return {
      attachments: [],
      kind: 'regenerate',
      messageId: generateUUIDv4(),
      text: this.received[last].text,
    };
  }

  // The latest reply, while the agent writes it.
  private get writingReply() {
    const last = this.received[this.received.length - 1];
    return last && last.role !== 'user' && last.isGenerating ? last.id : undefined;
  }

  private indexOf(message: Message) {
    return this.received.findIndex((item) => item.id === message.id);
  }

  // Works out what the conversation shows and where it is, after anything changes.
  private refresh() {
    const current = this.state.getLatestValue();
    const replaced = this.exchange?.state === 'waiting' ? this.exchange.replaced : undefined;
    let messages: readonly Message[] =
      !replaced && this.stopped.size === 0
        ? this.received
        : this.received.filter(
            (message) =>
              // A reply stopped before it showed anything has nothing to show, and the
              // conversation would think it is still on its way.
              !replaced?.has(message.id) &&
              !(this.stopped.has(message.id) && hasEmptyContent(message)),
          );
    if (sameItems(messages, current.messages)) messages = current.messages;
    const shownPending = this.exchange?.shownPending;
    const pendingMessage =
      current.pendingMessage?.id === shownPending?.id ? current.pendingMessage : shownPending;
    const nextRatings = this.currentRatings();
    const ratings = sameRatings(nextRatings, current.ratings) ? current.ratings : nextRatings;
    const next: AIConversationControllerState<Message> = {
      activity: this.activity,
      error: this.error,
      hasOlderMessages: this.hasOlderMessages,
      messages,
      pendingMessage,
      ratings,
      status: this.currentStatus(messages),
    };
    const changed = (Object.keys(next) as (keyof typeof next)[]).some(
      (key) => next[key] !== current[key],
    );
    if (changed) this.state.next(next);
  }

  private currentRatings() {
    const ratings: Record<string, AIMessageRating> = {};
    for (const message of this.received) {
      if (message.role !== 'user' && message.rating) ratings[message.id] = message.rating;
    }
    for (const [id, change] of this.ratingChanges) {
      if (change.shown) ratings[id] = change.shown;
      else delete ratings[id];
    }
    return ratings;
  }

  private currentStatus(messages: readonly Message[]): AIConversationStatus {
    if (this.exchange?.state === 'waiting') return 'submitted';
    const last = messages[messages.length - 1];
    if (last && last.role !== 'user' && last.isGenerating && !this.stopped.has(last.id)) {
      return hasEmptyContent(last) ? 'submitted' : 'streaming';
    }
    // The agent is working on the person's latest message, whose reply isn't here yet.
    if (
      this.activity &&
      this.activity.state !== AIAgentActivityStates.error &&
      (!last || last.role === 'user')
    ) {
      return 'submitted';
    }
    return this.error ? 'error' : 'ready';
  }
}
