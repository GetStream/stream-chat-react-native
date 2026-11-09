import { isRecord, isSameJSON } from './AIUIHelpers';

/**
 * The format a reply's UI is written in, such as `a2ui` or `openui`. Formats are an open set:
 * a renderer says which one it reads.
 */
export type AIUIFormat = 'a2ui' | 'openui' | (string & {});

/**
 * The UI an agent wrote for a reply, which shows in place of the reply's text.
 */
export type AIUIDocument = {
  /** The document in its format's own shape: a program's text, or JSON. */
  content: unknown;
  /** The format it is written in. */
  format: AIUIFormat;
  /** Whether the agent is still writing it. */
  isStreaming: boolean;
  /** The format's version, when the agent names one. */
  version?: string;
};

/**
 * A reply's `ai_ui` field as the agents router writes it. An app that reads it from its Stream
 * messages types it there with `ai_ui?: AIUIDocumentJSON` in its `CustomMessageData`.
 */
export type AIUIDocumentJSON = {
  /** The document in its format's own shape: usually text, such as A2UI's JSON lines. */
  content: unknown;
  format: AIUIFormat;
  /** `streaming` while the agent writes it, then `complete`. */
  status?: 'streaming' | 'complete' | (string & {});
  /** The version of the field's own layout; a newer one than this SDK reads shows the text. */
  v?: number;
  version?: string;
};

/** The custom field of a message that holds its document. */
export const AI_UI_CUSTOM_DATA_KEY = 'ai_ui';
/** The newest version of the `ai_ui` field this SDK reads. */
export const AI_UI_SUPPORTED_VERSION = 1;

/**
 * Reads the document of a message's `ai_ui` field, or returns `undefined` when it carries none
 * this SDK can read: no format, no content, or a field newer than this SDK, which can lay its
 * documents out differently. The reply then shows its text.
 */
export const parseAIUIDocument = (field: unknown): AIUIDocument | undefined => {
  if (!isRecord(field)) return undefined;
  const { content, format, status, v, version } = field;
  if (typeof format !== 'string' || format === '') return undefined;
  if (content === undefined || content === null) return undefined;
  if (typeof v === 'number' && v > AI_UI_SUPPORTED_VERSION) return undefined;
  return {
    content,
    format,
    isStreaming: status === 'streaming',
    ...(typeof version === 'string' && version !== '' ? { version } : {}),
  };
};

/** The content of a document when it is text, such as an OpenUI program or A2UI's JSON lines. */
export const aiUIDocumentText = (document: AIUIDocument) =>
  typeof document.content === 'string' ? document.content : undefined;

/**
 * Whether two documents are the same, content included. A message is a new object on every
 * update while a reply streams, so a document is compared by what it holds.
 */
export const isSameAIUIDocument = (a: AIUIDocument | undefined, b: AIUIDocument | undefined) =>
  a === b ||
  (!!a &&
    !!b &&
    a.format === b.format &&
    a.version === b.version &&
    a.isStreaming === b.isStreaming &&
    isSameJSON(a.content, b.content));
