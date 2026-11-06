import type {
  AIMessagePartData,
  AIReasoningPart,
  AIToolApprovalData,
  AIToolAuthorizationData,
  AIToolCallPart,
  AIToolCallStatus,
} from './types';

/** The attachment type prefix every AI step uses. */
export const AI_MESSAGE_PART_TYPE_PREFIX = 'ai_';
/** The newest format version of the built-in kinds this SDK understands. */
export const AI_MESSAGE_PART_SUPPORTED_VERSION = 1;

type JSONObject = Record<string, unknown>;

// Lenient reads: a field of the wrong type reads as missing, and an empty string as absent.
const isObject = (value: unknown): value is JSONObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const string = (object: JSONObject, key: string) => {
  const value = object[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
};

const int = (object: JSONObject, key: string) => {
  const value = object[key];
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : undefined;
};

const date = (object: JSONObject, key: string) => {
  const value = string(object, key);
  if (value === undefined) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
};

const parseApproval = (object: JSONObject): AIToolApprovalData | undefined => {
  // A question with no title asks nothing.
  const title = string(object, 'title');
  if (!title) return undefined;
  return {
    allowTitle: string(object, 'allow_title'),
    decision: string(object, 'decision'),
    declineTitle: string(object, 'decline_title'),
    message: string(object, 'message'),
    reason: string(object, 'reason'),
    title,
  };
};

// An http(s) URL with a host. Matched rather than read through `URL`, whose `protocol` and
// `host` throw "not implemented" on React Native before 0.80.
const WEB_URL = /^https?:\/\/[^\s/?#@]+(?:@[^\s/?#@]+)?(?:[/?#]|$)/i;

const isWebURL = (value: string) => WEB_URL.test(value);

const parseAuthorization = (object: JSONObject): AIToolAuthorizationData | undefined => {
  // A sign-in with no title, or no web page to open, asks nothing.
  const title = string(object, 'title');
  const url = string(object, 'url');
  if (!title || !url || !isWebURL(url)) return undefined;
  return {
    expiresAt: date(object, 'expires_at'),
    handoffToken: string(object, 'handoff_token'),
    message: string(object, 'message'),
    provider: string(object, 'provider') ?? '',
    providerName: string(object, 'provider_name'),
    status: string(object, 'status'),
    title,
    type: string(object, 'type') ?? 'oauth',
    url,
  };
};

const parseReasoning = (id: string, object: JSONObject): AIReasoningPart => ({
  durationMs: int(object, 'duration_ms'),
  id,
  preview: string(object, 'preview'),
  status: string(object, 'status') ?? 'completed',
  summary: string(object, 'summary'),
});

const parseToolCall = (id: string, object: JSONObject): AIToolCallPart => {
  const approval = object.approval;
  const authorization = object.authorization;
  const args = object.arguments;
  return {
    approval: isObject(approval) ? parseApproval(approval) : undefined,
    arguments: args === null ? undefined : args,
    authorization: isObject(authorization) ? parseAuthorization(authorization) : undefined,
    displayTitle: string(object, 'display_title'),
    durationMs: int(object, 'duration_ms'),
    executor: string(object, 'executor') ?? 'server',
    id,
    name: string(object, 'name') ?? '',
    status: string(object, 'status') ?? 'running',
    summary: string(object, 'summary'),
    targetClientId: string(object, 'target_client_id'),
    targetUserId: string(object, 'target_user_id'),
  };
};

/**
 * Decodes one attachment, or returns `undefined` when it is not an AI step.
 *
 * @param attachment The attachment, as it is on the message (with its `type`).
 * @param position The attachment's index, used as the identity of a step with no ID of its own.
 */
export const parseMessagePart = (
  attachment: unknown,
  position = 0,
): AIMessagePartData | undefined => {
  if (!isObject(attachment)) return undefined;
  const type = attachment.type;
  if (typeof type !== 'string' || !type.startsWith(AI_MESSAGE_PART_TYPE_PREFIX)) {
    return undefined;
  }
  const id = string(attachment, 'id') ?? `${type}-${position}`;
  const version = int(attachment, 'v') ?? 1;
  const known = version <= AI_MESSAGE_PART_SUPPORTED_VERSION;
  return {
    id,
    kind: type,
    payload: attachment,
    reasoning: known && type === 'ai_reasoning' ? parseReasoning(id, attachment) : undefined,
    toolCall: known && type === 'ai_tool_call' ? parseToolCall(id, attachment) : undefined,
    version,
  };
};

/**
 * Decodes the AI steps among a message's attachments, in order. Attachments that are not AI
 * steps (images, files and so on) are skipped. Decoding is lenient: missing fields get
 * defaults, and a step newer than this SDK understands keeps its payload but has no typed
 * view.
 *
 * ```ts
 * const parts = parseMessageParts(message.attachments);
 * ```
 */
export const parseMessageParts = (attachments: readonly unknown[] | null | undefined) =>
  (attachments ?? []).reduce<AIMessagePartData[]>((parts, attachment, position) => {
    const part = parseMessagePart(attachment, position);
    if (part) parts.push(part);
    return parts;
  }, []);

/** Whether this SDK has a typed view of the step. */
export const isSupportedPart = (part: AIMessagePartData) =>
  part.reasoning !== undefined || part.toolCall !== undefined;

/** Whether the call has finished, one way or another. */
export const isToolCallFinished = (status: AIToolCallStatus) =>
  status === 'completed' || status === 'failed' || status === 'cancelled';

/**
 * Whether the person declined the call, or the sign-in it waited for, so it never ran.
 */
export const isDeclined = (call: AIToolCallPart) =>
  call.approval?.decision === 'declined' || call.authorization?.status === 'declined';

/**
 * Whether this call is waiting for this device: a client tool, still awaiting its result,
 * targeted at this person and this install.
 */
export const isAwaitingClient = (call: AIToolCallPart, userId: string, clientId: string) =>
  call.executor === 'client' &&
  call.status === 'awaiting_client' &&
  call.targetUserId === userId &&
  call.targetClientId === clientId;

/**
 * Whether this call is waiting for this person to allow it, on this device: still awaiting
 * approval, targeted at this person, and at this install when it names one (a client tool
 * does; a server tool's question may be answered from any of their devices).
 */
export const isAwaitingApproval = (call: AIToolCallPart, userId: string, clientId: string) =>
  call.status === 'awaiting_approval' &&
  call.approval !== undefined &&
  call.targetUserId === userId &&
  (call.targetClientId === undefined || call.targetClientId === clientId);

/** Whether this call is waiting for this person to sign in, from any of their devices. */
export const isAwaitingAuthorization = (call: AIToolCallPart, userId: string) =>
  call.status === 'awaiting_authorization' &&
  call.authorization !== undefined &&
  call.targetUserId === userId;

/** Whether a sign-in that is still asked for has passed its `expiresAt`. */
export const isAuthorizationExpired = (authorization: AIToolAuthorizationData, now = Date.now()) =>
  authorization.status === 'expired' ||
  (authorization.status === undefined &&
    authorization.expiresAt !== undefined &&
    authorization.expiresAt <= now);
