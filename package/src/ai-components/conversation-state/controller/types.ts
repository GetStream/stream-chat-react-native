import type { AIBranchSwitch } from '../../message/AIBranchSwitcher';
import type { AIMessageRating } from '../../message/AIReplyActions';
import type { AIChatOption } from '../../message-composer/ChatOptions';
import type { MediaAsset } from '../../services/media-picker-service/AbstractMediaPickerService';
import type { AIMessage } from '../types';

/**
 * Where the latest exchange with the agent is:
 * - `ready`: nothing is on its way: the agent answered, or the person stopped it.
 * - `submitted`: the person's request is on its way, or the agent is working on it and its reply
 *   shows nothing yet.
 * - `streaming`: the agent is writing its reply.
 * - `error`: the latest request failed, the agent couldn't answer it, or a `switchBranch` failed.
 *   `retry()` tries again.
 */
export type AIConversationStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/** Whether the agent is answering: the request is submitted, or its reply streaming. */
export const isAIConversationAnswering = (status: AIConversationStatus) =>
  status === 'submitted' || status === 'streaming';

/**
 * What the person asks for:
 * - `message`: a new message from the person.
 * - `regenerate`: a new reply in place of the request's `message`, which is a reply, and of those
 *   after it. Without `message`, a reply to the latest message, which has none, such as after the
 *   agent couldn't answer it.
 * - `edit`: the person changed the request's `message`, one of theirs, to say its `text`: it is
 *   answered again, in place of the replies after it.
 *
 * An open set: a kind of your own is on its way like a message.
 */
export type AIConversationRequestKind = 'message' | 'regenerate' | 'edit' | (string & {});

/** What the person asks the agent, as an `AIConversationTransport` sends it. */
export type AIConversationRequest<Message extends AIMessage = AIMessage> = {
  /** What the person asks for. */
  kind: AIConversationRequestKind;
  /**
   * An id for the person's message. A transport that creates the message with it lets the
   * conversation find its copy by it.
   *
   * A retry keeps it after the transport's `send` rejected, since the backend may already have
   * the request. Once the agent had the request but didn't answer it (an `AIAgentError`, or the
   * reply timeout), a retry sends it under a new id, whatever its kind: a backend that tells
   * requests apart by id, such as the Stream Agents router, takes a request whose id it already
   * handled for a duplicate and starts nothing. A message of the person's that already arrived
   * is answered with a `regenerate` instead, so it isn't added twice.
   */
  messageId: string;
  /** What the person wrote. When a reply is written again, the message it answers says it. */
  text: string;
  /** The files the person picked, on this device, to upload with their message. */
  attachments: MediaAsset[];
  /** The option the person picked in the composer, such as thinking harder. */
  chatOption?: AIChatOption;
  /**
   * What the composer held besides, as `ComposerState.custom`, or what `send` was given as
   * `custom`. What the person did in a reply's generated UI travels here as `uiAction`, the
   * action's JSON from `aiUIActionJSON`, and the transport hands it to the agent, such as
   * `session.responses.create(request.text, { uiAction: request.custom?.uiAction })`.
   */
  custom?: Record<string, unknown>;
  /** The message it is about: the reply to write again, or the person's message they edited. */
  message?: Message;
};

/** The ids of the states Stream Chat's AI indicator reports. */
export const AIAgentActivityStates = {
  checkingExternalSources: 'AI_STATE_EXTERNAL_SOURCES',
  error: 'AI_STATE_ERROR',
  generating: 'AI_STATE_GENERATING',
  thinking: 'AI_STATE_THINKING',
} as const;

/**
 * What the agent is doing. An open set: compare against the states you know. Those of
 * `AIAgentActivityStates` are Stream Chat's AI indicator's.
 */
export type AIAgentActivityState =
  | (typeof AIAgentActivityStates)[keyof typeof AIAgentActivityStates]
  | (string & {});

/** What the agent says it is doing besides what its reply shows, such as checking sources. */
export type AIAgentActivity = {
  state: AIAgentActivityState;
  /** What it says about it, such as "Searching the web", or why it couldn't answer. */
  text?: string;
};

/**
 * What the conversation's views offer the person to do with its messages. All by default.
 * Without the transport's `switchBranch`, editing and regenerating are offered on the latest
 * message only; with it, on any with a version mark (`responseId`), since the versions they
 * replace stay a switch away. The transport has nothing to branch from without one.
 */
export type AIConversationActions = {
  /**
   * Editing the person's latest message, or with `switchBranch` any of theirs with a
   * `responseId`, which is then answered again.
   */
  edit?: boolean;
  /** Rating replies. */
  rate?: boolean;
  /**
   * Asking for a new reply in place of the latest, or with `switchBranch` in place of any
   * finished reply with a `responseId`.
   */
  regenerate?: boolean;
};

/** What a message of the person's offers, from `userMessageActions`. */
export type AIUserMessageActions = {
  /** Which of the question's versions shows, with how to show the others. */
  branch?: AIBranchSwitch;
  /**
   * Saves the person's edit of the message, which they make in place, with its new text. Without
   * it, no in-place edit.
   */
  onSaveEdit?: (text: string) => void;
};

/**
 * Where an `AIConversationTransport` tells its `AIConversationController` what the conversation
 * holds. Once the controller is disposed, its updates go nowhere.
 */
export type AIConversationFeed<Message extends AIMessage = AIMessage> = {
  /** Whether the controller it updates is still there. Stop following what it holds once it isn't. */
  readonly isConnected: boolean;
  /** The conversation's messages, oldest first, each time they change. */
  updateMessages: (messages: readonly Message[]) => void;
  /** Whether there are messages before the first one, which `loadOlderMessages` loads. */
  updateHasOlderMessages: (hasOlderMessages: boolean) => void;
  /** What the agent says it is doing, or `undefined` once it stops saying. */
  updateActivity: (activity: AIAgentActivity | undefined) => void;
};

/**
 * How an `AIConversationController` reaches the agent and learns what it holds: it sends what the
 * person asks, stops the agent, and tells the controller its messages as they change.
 *
 * With Stream Chat, the conversation is a channel: the transport follows its messages and AI
 * indicator events, and sends each request through the channel or your agent's own API.
 *
 * ```ts
 * const transport: AIConversationTransport = {
 *   connect: (feed) => {
 *     const update = () => feed.updateMessages(channel.state.messages.map(fromStreamMessage));
 *     update();
 *     return channel.on(update).unsubscribe;
 *   },
 *   send: (request) => agent.respond(request.text, request.attachments),
 *   stop: () => agent.interrupt(),
 * };
 * ```
 */
export type AIConversationTransport<Message extends AIMessage = AIMessage> = {
  /**
   * Starts telling `feed` what the conversation holds: its messages each time they change,
   * whether there are older ones to load, and what the agent says it is doing. The controller
   * calls it once, as it is made, and calls what it returns once it is disposed.
   */
  connect: (feed: AIConversationFeed<Message>) => void | (() => void);
  /**
   * Sends what the person asks. Resolve once the agent has the request: its reply arrives
   * through the feed. A rejection shows as the conversation's error, and the person can retry,
   * which sends the same request again with the same `messageId` (see `messageId`): if the
   * first attempt reached your backend, or you keep a copy of the failed message, use the id so
   * the message isn't added twice. A rejection with an `AbortError` ends the request without an
   * error.
   *
   * The controller leaves out the messages a `regenerate` or an `edit` replaces only until the
   * new reply starts. From then on it shows the messages as the feed has them, so update the
   * conversation before the new reply arrives:
   * - For a regenerate, remove the request's `message` and the messages after it, or write the
   *   new reply in place of `message`, under its id.
   * - For an edit, change the person's `message` to say the request's `text`, under its id, and
   *   remove the messages after it.
   *
   * With `switchBranch`, the request's `message` can be any finished reply or any of the
   * person's messages, not only the latest: the messages after it are left out the same way,
   * and the version it starts is fed as the conversation, in place of the one it replaces.
   * Until the new reply starts, the controller leaves out everything from `message`'s position
   * on, and counts as the reply a message that wasn't there, at or after that position.
   *
   * A request of any kind sent on a version a switch shows may first bring that version back
   * into the conversation, its messages re-sent under new ids. Feed each copy with `resentFrom`,
   * the id of the message it copies (`fromStreamMessage` reads it from `custom.resent_from`): a
   * copy is never taken for the request's reply.
   */
  send: (request: AIConversationRequest<Message>) => Promise<void>;
  /** Stops the reply the agent is writing. What it wrote so far stays. */
  stop: () => Promise<void>;
  /** Loads the messages before the first one, which arrive through the feed. */
  loadOlderMessages?: () => Promise<void>;
  /**
   * Tells your backend how the person rated a reply, or that they took their rating back with
   * `null`. Without it, the controller keeps the ratings on this device. Ratings your backend has
   * show through each message's `rating`.
   */
  rate?: (reply: Message, rating: AIMessageRating | null) => Promise<void>;
  /**
   * Shows the previous or the next version of the branch `message` belongs to: a reply's
   * regenerated versions when its `branch.of` is `'reply'`, the person's edited versions of a
   * question when it is `'question'`. Feed the messages of that version through
   * `feed.updateMessages`. A rejection shows as the conversation's error, which the controller's
   * `retry()` tries again; one with an `AbortError` shows nothing.
   *
   * `signal` aborts once the person sends a request before the switch finishes: feed nothing of
   * that version from then on, since it would take the place of the request's. The controller
   * ignores the switch's outcome either way. Optional to honour, but a transport that feeds the
   * version anyway can hide the request's question.
   *
   * With it, the conversation's views show a ‹ i/n › switcher on each message whose `branch` has
   * two versions or more, and offer regenerating any finished reply and editing any of the
   * person's messages that has a `responseId`. Without it, only the latest, and no switcher.
   */
  switchBranch?: (message: Message, to: 'previous' | 'next', signal?: AbortSignal) => Promise<void>;
};
