/**
 * The steps an AI agent took while replying, such as a round of reasoning or a tool call.
 *
 * The agent writes each step as a custom attachment on its reply (`ai_reasoning`,
 * `ai_tool_call`), and the order of the attachments is the order of the steps. The final
 * answer stays in the message text and is shown after them.
 *
 * The kinds, statuses and decisions are open sets: compare against the values you know and
 * give the rest a fallback. A step newer than this SDK understands keeps its payload but has
 * no typed view.
 */

// Keeps autocompletion for the known values while accepting any string.
type Open<T extends string> = T | (string & {});

export type AIMessagePartKind = Open<'ai_reasoning' | 'ai_tool_call'>;

/** Where a round of reasoning is. Defaults to `completed` when the agent sends none. */
export type AIReasoningStatus = Open<'streaming' | 'completed'>;

/** A round of the model's reasoning (`ai_reasoning`). */
export type AIReasoningPart = {
  id: string;
  status: AIReasoningStatus;
  /** How long the model thought, in milliseconds. */
  durationMs?: number;
  /**
   * A capped excerpt: the latest thoughts while streaming, the opening once done. The full
   * reasoning, when an app has it, arrives separately.
   */
  preview?: string;
  /** A one-line summary of the reasoning, once it is done. */
  summary?: string;
};

/**
 * Where a tool call is. Treat a status this SDK doesn't know as still in progress.
 *
 * - `running`: the agent's backend or a device is running it.
 * - `awaiting_client`: waiting for the targeted device to run the tool and send its result.
 * - `awaiting_approval`: waiting for the targeted person to allow or decline it.
 * - `awaiting_authorization`: waiting for the targeted person to sign in at a provider.
 * - `completed`, `failed`, `cancelled`: finished, one way or another.
 */
export type AIToolCallStatus = Open<
  | 'running'
  | 'awaiting_client'
  | 'awaiting_approval'
  | 'awaiting_authorization'
  | 'completed'
  | 'failed'
  | 'cancelled'
>;

/** Who runs a tool: the agent's backend (`server`) or a person's device (`client`). */
export type AIToolExecutor = Open<'server' | 'client'>;

export type AIToolApprovalDecision = Open<'allowed' | 'declined'>;

/**
 * What a tool call asks the person it waits for before it runs, such as "Share your
 * location?", and how they answered. Allowed, the call goes on; declined, it is cancelled
 * and never runs.
 */
export type AIToolApprovalData = {
  /** The question, such as "Share your location?". */
  title: string;
  /** The label of the button that allows the call. Defaults to "Allow" when the agent sends none. */
  allowTitle?: string;
  /** How the person answered, once they did. */
  decision?: AIToolApprovalDecision;
  /** The label of the button that declines the call. Defaults to "Don't Allow". */
  declineTitle?: string;
  /** What allowing it shares or does, such as "Only your city is shared." */
  message?: string;
  /** The agent's own words for why it wants the call, such as "to check the local weather". */
  reason?: string;
};

/** How a person signs in: `oauth` is a consent at the provider, in a browser. */
export type AIToolAuthorizationType = Open<'oauth'>;

/**
 * How a sign-in ended. `failed` is one the provider or the agent's backend ended without
 * connecting, such as when the person came back as another account.
 */
export type AIToolAuthorizationStatus = Open<'connected' | 'declined' | 'expired' | 'failed'>;

/**
 * A sign-in a tool call waits for, such as "Connect Linear", and how it ended. It holds no
 * credential: `url` is the agent's own sign-in page, and the provider hands what it grants to
 * the agent's backend, never to the app.
 */
export type AIToolAuthorizationData = {
  /** The provider, such as `linear`. */
  provider: string;
  /** The question, such as "Connect Linear". */
  title: string;
  type: AIToolAuthorizationType;
  /** The sign-in page to open (the router's launch page). An `http(s)` URL. */
  url: string;
  /** When the sign-in ends, in milliseconds since the epoch. */
  expiresAt?: number;
  /**
   * What binds the sign-in to the first browser that opens it. The launch page reads it from its
   * URL's fragment. Gone once the sign-in is over.
   */
  handoffToken?: string;
  /** What signing in means for the person. */
  message?: string;
  /** What people call the provider, such as "Linear". */
  providerName?: string;
  /** How it ended, once it did. */
  status?: AIToolAuthorizationStatus;
};

/** A tool the agent called, run by the agent's backend or by a person's device. */
export type AIToolCallPart = {
  /** The model provider's tool-call ID. A device's result is matched against it. */
  id: string;
  name: string;
  /** Defaults to `server` when the agent sends none. */
  executor: AIToolExecutor;
  /** Defaults to `running` when the agent sends none. */
  status: AIToolCallStatus;
  /** What the call asks the person it waits for, and how they answered, when its tool asks first. */
  approval?: AIToolApprovalData;
  /** The call's arguments, present for client tools, which need them to run. */
  arguments?: unknown;
  /** The sign-in the call waits for, and how it ended, when it needs the person's account at a provider. */
  authorization?: AIToolAuthorizationData;
  /** What the call is doing, in words for people, such as "Checking your location". */
  displayTitle?: string;
  durationMs?: number;
  /** A short, shareable outcome, such as "Found your location". */
  summary?: string;
  /** The install that must run a client tool. */
  targetClientId?: string;
  /** The person the call waits for. */
  targetUserId?: string;
};

/** One step of a reply, decoded from one `ai_*` attachment. */
export type AIMessagePartData = {
  /** The step's stable identity, for keys and animation. Tool calls use the provider's tool-call ID. */
  id: string;
  /** The attachment type, such as `ai_reasoning`. */
  kind: AIMessagePartKind;
  /** The attachment as it came, for kinds of your own or fields this SDK does not read. */
  payload: Record<string, unknown>;
  /** The step's format version (`v`). It changes only when a kind changes incompatibly. */
  version: number;
  /** The step as a round of reasoning, when it is one this SDK can read. */
  reasoning?: AIReasoningPart;
  /** The step as a tool call, when it is one this SDK can read. */
  toolCall?: AIToolCallPart;
};
