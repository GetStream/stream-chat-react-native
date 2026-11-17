import { StateStore } from '@stream-io/state-store';

import { AIAgentError } from './AIAgentError';
import { AIConversationExchange, hasEmptyContent } from './AIConversationExchange';
import {
  editActionOf,
  latestUserMessageIdOf,
  replyActionsOf,
  userMessageActionsOf,
} from './offers';
import {
  type AIAgentActivity,
  AIAgentActivityStates,
  type AIConversationActions,
  type AIConversationFeed,
  type AIConversationRequest,
  type AIConversationStatus,
  type AIConversationTransport,
  type AIUserMessageActions,
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
   * Whether another version of a message is on its way through the transport's `switchBranch`.
   * Meanwhile `status` stays as it was, and the views offer no other switch, nor regenerating
   * or editing the message it switches. Sending, and regenerating or editing any other message,
   * stay offered: such a request gives up on the switch, whose `AbortSignal` aborts. A switch
   * that takes longer than `switchTimeout` is given up on too, with a retryable `error`.
   */
  isSwitchingBranch: boolean;
  /**
   * Why the latest request or switch failed, or, as an `AIAgentError`, what the agent said when
   * it couldn't answer or that it didn't answer in time. It stays until the next request or
   * switch, or until a reply starts after all.
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
  /**
   * How many milliseconds a `switchBranch` may take before the controller gives up on it: it
   * aborts the switch's signal and shows a retryable error named `TimeoutError`. 30 seconds by
   * default: a switch is a couple of reads from the backend, well under a second normally, and
   * the switcher's arrows stay disabled while one runs. `null` or `Infinity` waits as long as it
   * takes.
   */
  switchTimeout?: number | null;
};

/** What the person sends: what `ComposerView` hands on. */
export type AIConversationSendData = {
  text: string;
  /** The files the person picked, on this device. */
  attachments?: MediaAsset[];
  /** The option the person picked in the composer. */
  chatOption?: AIChatOption;
  /**
   * Goes to the transport as the request's `custom`, such as a generated-UI action as
   * `{ uiAction: aiUIActionJSON(action) }`.
   */
  custom?: Record<string, unknown>;
};

const DEFAULT_REPLY_TIMEOUT = 5 * 60 * 1000;
const DEFAULT_SWITCH_TIMEOUT = 30 * 1000;

const switchTimedOut = () =>
  Object.assign(new Error('The other version didn’t load in time'), { name: 'TimeoutError' });
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

// A switch to another version on its way, and when it is given up on for taking too long.
type Switching<Message> = {
  controller: AbortController;
  message: Message;
  timer?: ReturnType<typeof setTimeout>;
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
 * With the transport's `switchBranch`, any finished reply can be regenerated and any of the
 * person's messages edited, when it has a version mark (`responseId`), and a ‹ i/n › switcher
 * shows the other versions of each.
 *
 * Create it in the effect that disposes it, not in `useState`: React's StrictMode runs an
 * effect's cleanup and then the effect again, which would leave the views with a disposed
 * controller.
 *
 * ```tsx
 * const [conversation, setConversation] = useState<AIConversationController>();
 * useEffect(() => {
 *   const created = new AIConversationController({ transport });
 *   setConversation(created);
 *   return () => {
 *     created.dispose();
 *     setConversation(undefined);
 *   };
 * }, [transport]);
 *
 * if (!conversation) return null;
 *
 * <AIConversation conversation={conversation} />
 * <ComposerView conversation={conversation} />
 * ```
 *
 * What the person sends shows straight away, and the agent thinks until its reply starts. While
 * a reply is written again, or a message the person edited is answered again, the messages it
 * replaces, from that message to the end, are left out of `messages` until the new reply starts.
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
  /**
   * Whether the transport shows a message's other versions (`switchBranch`). Then any finished
   * reply can be regenerated and any of the person's messages edited, when it has a version mark
   * (`responseId`), and a message with several versions offers a ‹ i/n › switcher.
   */
  readonly canSwitchBranch: boolean;

  private readonly transport: AIConversationTransport<Message>;
  private readonly replyTimeout: number | null;
  private readonly switchTimeout: number | null;
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
  // The switch on its way, which the next request or another dispose gives up on.
  private switching: Switching<Message> | undefined;
  // The switch that failed and why, which `retry()` runs again, until the next switch or request,
  // or `clearError()`. It shows as `error` over the latest request's, which a switch keeps.
  private failedSwitch: { error: Error; message: Message; to: 'previous' | 'next' } | undefined;
  private isLoadingOlderMessages = false;

  constructor({
    actions,
    approver,
    composer,
    replyTimeout = DEFAULT_REPLY_TIMEOUT,
    switchTimeout = DEFAULT_SWITCH_TIMEOUT,
    transport,
  }: AIConversationControllerOptions<Message>) {
    this.transport = transport;
    this.composer = composer ?? createNewComposerStore();
    this.approver = approver;
    this.actions = { ...ALL_ACTIONS, ...actions };
    this.replyTimeout = replyTimeout;
    this.switchTimeout = switchTimeout;
    this.canSwitchBranch = typeof transport.switchBranch === 'function';
    this.state = new StateStore<AIConversationControllerState<Message>>({
      activity: undefined,
      error: undefined,
      hasOlderMessages: false,
      isSwitchingBranch: false,
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
    this.giveUpSwitching();
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

  /**
   * Asks the agent to answer a message of the person's again, changed to say `text`: an `edit`
   * request, sent straight away rather than through the composer, as an in-place editor saves
   * it. Does nothing for an empty text, or where `userMessageActions` doesn't offer it: without
   * the transport's `switchBranch`, while the agent answers, or on an earlier message without a
   * version mark. An edit open in the composer is dropped.
   */
  editInPlace(message: Message, text: string) {
    if (text.trim() === '' || !this.userMessageActions(message)?.onSaveEdit) return;
    this.cancelEditing();
    this.start({
      attachments: [],
      kind: 'edit',
      message,
      messageId: generateUUIDv4(),
      text,
    });
  }

  /** Stops editing a message, and empties the composer. */
  cancelEditing() {
    if (!this.editingMessage) return;
    this.edited = undefined;
    this.composer.partialNext({ isEditing: false, text: '' });
  }

  /**
   * Tries again after `error`: sends the request that failed again, with the same message id
   * after the transport rejected it, or under a new one once the agent had it but didn't answer
   * (`AIConversationRequest.messageId` says why), asks the agent again for the reply it couldn't
   * write, or switches again to the version a `switchBranch` failed to show.
   */
  retry() {
    const { exchange, failedSwitch } = this;
    if (failedSwitch) {
      this.switchBranch(failedSwitch.message, failedSwitch.to);
      return;
    }
    if (!exchange?.hasFailed) return;
    this.start(exchange.retryRequest(this.received));
  }

  /**
   * Forgets `error`, and the request or switch that failed. A failed switch's error hides a
   * request that failed before it, which is forgotten only once its own error was shown.
   */
  clearError() {
    if (this.failedSwitch) {
      this.failedSwitch = undefined;
    } else {
      this.error = undefined;
      if (this.exchange?.hasFailed) this.exchange = undefined;
    }
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
   * Shows the previous or the next version of the branch `message` belongs to, through the
   * transport's `switchBranch`: a reply's regenerated versions, or the person's edits of a
   * question. Does nothing without it, while the agent is answering, while another switch is on
   * its way, or before the first version. Past the last the mark knows, the transport judges,
   * since a version may have been added since the mark was written. Until it finishes,
   * `isSwitchingBranch` is `true`; a request started meanwhile aborts the `AbortSignal` the
   * transport gets, and the switch's outcome is ignored. A failure shows as `error` (status
   * `error`), and `retry()` switches again; the next switch forgets it as it starts. A request
   * that failed before stays, with its `error` and its retry, since the person's message can still
   * be sent again.
   */
  switchBranch(message: Message, to: 'previous' | 'next') {
    const { branch } = message;
    if (
      !this.transport.switchBranch ||
      !branch ||
      this.switching ||
      isAIConversationAnswering(this.state.getLatestValue().status) ||
      (to === 'previous' && branch.index <= 1)
    ) {
      return;
    }
    const switching: Switching<Message> = { controller: new AbortController(), message };
    this.switching = switching;
    this.failedSwitch = undefined;
    this.refresh();
    // A switch that never finishes would keep the arrows disabled.
    const timeout = this.switchTimeout;
    switching.timer =
      timeout === null || !Number.isFinite(timeout) || timeout > MAX_TIMEOUT
        ? undefined
        : setTimeout(
            () => {
              if (this.disposed || this.switching !== switching) return;
              this.switching = undefined;
              switching.controller.abort();
              this.failedSwitch = { error: switchTimedOut(), message, to };
              this.refresh();
            },
            Math.max(timeout, 0),
          );
    void (async () => {
      try {
        await this.transport.switchBranch?.(message, to, switching.controller.signal);
      } catch (error) {
        // A request took its place, it took too long, or the person gave up on it.
        if (this.disposed || this.switching !== switching || isAbortError(error)) return;
        this.failedSwitch = { error: asError(error), message, to };
      } finally {
        clearTimeout(switching.timer);
        if (this.switching === switching) {
          this.switching = undefined;
          if (!this.disposed) this.refresh();
        }
      }
    })();
  }

  // Gives up on the switch on its way, if any.
  private giveUpSwitching() {
    clearTimeout(this.switching?.timer);
    this.switching?.controller.abort();
    this.switching = undefined;
  }

  /** The message whose version the switch on its way changes, if any. */
  get switchingMessageId(): string | undefined {
    return this.switching?.message.id;
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
   * What the person can do with a finished reply: rate it, write it again while the agent isn't
   * answering (while it is the latest, or, with the transport's `switchBranch`, any with a
   * version mark, `responseId`), and, with `switchBranch`, switch between its versions (`branch`).
   */
  replyActions(reply: Message, isLatestReply: boolean): Omit<AIReplyActionsProps, 'text'> {
    return replyActionsOf(this, this.state.getLatestValue(), reply, isLatestReply);
  }

  /**
   * Edits a message of the person's in the composer while the agent isn't answering: their
   * latest, or, with the transport's `switchBranch`, any with a version mark (`responseId`).
   */
  editAction(message: Message): (() => void) | undefined {
    const { isSwitchingBranch, messages, status } = this.state.getLatestValue();
    return editActionOf(
      this,
      { isSwitchingBranch, latestUserMessageId: latestUserMessageIdOf(messages), status },
      message,
    );
  }

  /**
   * What a message of the person's offers with the transport's `switchBranch`: the switcher
   * between the versions of a question they edited (`branch`), and editing it in place
   * (`onSaveEdit`, through `editInPlace`) when `editAction` would offer editing it.
   */
  userMessageActions(message: Message): AIUserMessageActions | undefined {
    const { isSwitchingBranch, messages, status } = this.state.getLatestValue();
    return userMessageActionsOf(
      this,
      { isSwitchingBranch, latestUserMessageId: latestUserMessageIdOf(messages), status },
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
    // What a switch shows is a version, never the reply to a request that failed before it. A
    // switch can also start once a request was stopped or timed out, so a late reply arriving
    // during the switch is skipped as well.
    if (exchange && this.switching) {
      for (const message of messages) exchange.known.add(message.id);
    }
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
    // The version a switch on its way would feed would take the place of this request's.
    this.giveUpSwitching();
    this.failedSwitch = undefined;
    this.error = undefined;
    this.activity = undefined;
    this.ignoresActivity = false;
    this.stopped = new Set();
    this.clearReplyTimer();
    this.exchange = new AIConversationExchange(id, request, this.received, this.canSwitchBranch);
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
    } else if (
      exchange.hasFailed &&
      hasEmptyContent(reply) &&
      !reply.isGenerating &&
      !reply.uiDocument
    ) {
      // The reply the agent couldn't write, closed with nothing in it, as a backend may leave it
      // after the error: the request is still unanswered, and `retry()` asks again.
      return;
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
      this.exchange = new AIConversationExchange(
        ++this.generation,
        request,
        this.received,
        this.canSwitchBranch,
      );
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
    const hidden =
      this.exchange?.state === 'waiting' ? this.exchange.hiddenIn(this.received) : undefined;
    let messages: readonly Message[] =
      !hidden?.size && this.stopped.size === 0
        ? this.received
        : this.received.filter(
            (message) =>
              // A reply stopped before it showed anything has nothing to show, and the
              // conversation would think it is still on its way.
              !hidden?.has(message.id) &&
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
      error: this.failedSwitch?.error ?? this.error,
      hasOlderMessages: this.hasOlderMessages,
      isSwitchingBranch: !!this.switching,
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
    return this.error || this.failedSwitch ? 'error' : 'ready';
  }
}
