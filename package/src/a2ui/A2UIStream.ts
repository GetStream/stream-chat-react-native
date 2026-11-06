import type { AIUIDocument } from '../ai-components/generative-ui/AIUIDocument';
import { isRecord } from '../ai-components/generative-ui/AIUIHelpers';

/** The version of A2UI this renderer reads. */
export const A2UI_VERSION = '1.0';

// The spellings of 1.0 an agent may write, such as from instructions written before its
// release, or by copying the fence's `ui:a2ui@1.0` in another form.
const VERSION_SPELLINGS = new Set(['1', '1.0', '1.0.0', 'v1', 'v1.0']);

/** Whether a reply's A2UI of `version`, or of no version, is one this renderer reads. */
export const supportsA2UIVersion = (version: string | undefined) =>
  version === undefined || VERSION_SPELLINGS.has(version);

/**
 * The complete A2UI messages in `text`, as written: every top-level JSON object, in order.
 * One object per line, a pretty-printed one or a JSON array of them all read the same, and
 * words around them are skipped. An object still being written is left out until it closes, so
 * a reply's UI shows each message as it completes.
 */
export const a2uiMessagesIn = (text: string): string[] => {
  const messages: string[] = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"' && depth > 0) {
      inString = true;
    } else if (char === '{') {
      if (depth === 0) start = index;
      depth++;
    } else if (char === '}' && depth > 0) {
      depth--;
      if (depth === 0) messages.push(text.slice(start, index + 1));
    }
  }
  return messages;
};

/**
 * The messages of a document as text: as the agent wrote them, or written out when a backend
 * sent them as JSON. `undefined` for content that holds no messages.
 */
export const a2uiSourceOf = (document: AIUIDocument): string | undefined => {
  const { content } = document;
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    try {
      return JSON.stringify(content);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/**
 * A message as the processor reads it: 1.0 in its own spelling, and a surface the agent made
 * without naming a catalog made with `catalogId`, the catalog with the app's components.
 */
export const normalizeA2UIMessage = (
  message: Record<string, unknown>,
  catalogId: string,
): Record<string, unknown> => {
  let normalized = message;
  if (typeof message.version === 'string' && VERSION_SPELLINGS.has(message.version)) {
    normalized = { ...normalized, version: A2UI_VERSION };
  }
  const { createSurface } = normalized;
  if (isRecord(createSurface) && createSurface.catalogId === undefined) {
    normalized = { ...normalized, createSurface: { ...createSurface, catalogId } };
  }
  return normalized;
};
