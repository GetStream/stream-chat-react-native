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
 * - `error`: the latest request failed, or the agent couldn't answer it. `retry()` tries again.
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
   * conversation find its copy by it. A retry of the request keeps it.
   */
  messageId: string;
  /** What the person wrote. When a reply is written again, the message it answers says it. */
  text: string;
  /** The files the person picked, on this device, to upload with their message. */
  attachments: MediaAsset[];
  /** The option the person picked in the composer, such as thinking harder. */
  chatOption?: AIChatOption;
  /** What the composer held besides, as `ComposerState.custom`. */
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

/** What the conversation's views offer the person to do with its messages. All by default. */
export type AIConversationActions = {
  /** Editing the person's latest message, which is then answered again. */
  edit?: boolean;
  /** Rating replies. */
  rate?: boolean;
  /** Asking for a new reply in place of the latest. */
  regenerate?: boolean;
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
   * which sends the same request again with the same `messageId`: if the first attempt reached
   * your backend, or you keep a copy of the failed message, use the id so the message isn't added
   * twice. A rejection with an `AbortError` ends the request without an error.
   *
   * The controller leaves out the messages a `regenerate` or an `edit` replaces only until the
   * new reply starts. From then on it shows the messages as the feed has them, so update the
   * conversation before the new reply arrives:
   * - For a regenerate, remove the request's `message` and the messages after it, or write the
   *   new reply in place of `message`, under its id.
   * - For an edit, change the person's `message` to say the request's `text`, under its id, and
   *   remove the messages after it.
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
};
