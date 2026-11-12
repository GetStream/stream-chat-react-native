import type { AIUIFormat } from './AIUIDocument';
import { utf8ByteLength } from './AIUIHelpers';

/**
 * What the person did in a reply's UI, such as tapping a place or submitting a form. It goes to
 * the agent as their next message: `label` is its text and `aiUIActionJSON(action)` what it
 * carries.
 */
export type AIUIAction = {
  /** The format of the UI it came from. */
  format: AIUIFormat;
  /** What the person did, in their words, such as "Tell me more about St. Naum". */
  label: string;
  /** The reply whose UI it came from. */
  messageId: string;
  /**
   * What happened, such as an event of an app's component (`ask_about`) or OpenUI's
   * `continue_conversation`.
   */
  name: string;
  /** The details in the format's own shape, such as what was chosen and a form's values. */
  payload: Record<string, unknown>;
};

/** The action as the JSON object an agent's backend reads. */
export type AIUIActionJSON = {
  format: AIUIFormat;
  message_id: string;
  name: string;
  payload: Record<string, unknown>;
  v: 1;
};

/** The custom field of the person's message that holds the action. */
export const AI_UI_ACTION_CUSTOM_DATA_KEY = 'ai_ui_action';
/**
 * The most an action may take as JSON. The agents router refuses a larger one, and its
 * refusal would lose the person's message with it.
 */
export const AI_UI_ACTION_MAX_BYTES = 8 * 1024;

/**
 * The action as the JSON object an agent's backend reads, such as the `uiAction` of
 * `session.responses.create(action.label, { uiAction })`. The label is not in it: it is the
 * text of the person's message.
 */
export const aiUIActionJSON = (action: AIUIAction): AIUIActionJSON => ({
  format: action.format,
  message_id: action.messageId,
  name: action.name,
  payload: action.payload,
  v: 1,
});

/**
 * Why the agent's backend would refuse the action, or `undefined` when it would take it: it
 * names its reply, its format and what happened, in at most `AI_UI_ACTION_MAX_BYTES` of JSON.
 */
export const aiUIActionProblem = (action: AIUIAction): string | undefined => {
  if (!action.messageId) return 'an action names the reply it came from';
  if (!action.format) return 'an action names the format of its UI';
  if (!action.name) return 'an action names what happened';
  let json: string;
  try {
    json = JSON.stringify(aiUIActionJSON(action));
  } catch {
    return 'an action carries only JSON';
  }
  const bytes = utf8ByteLength(json);
  return bytes > AI_UI_ACTION_MAX_BYTES
    ? `an action takes at most ${AI_UI_ACTION_MAX_BYTES} bytes as JSON, and this one takes ${bytes}`
    : undefined;
};
