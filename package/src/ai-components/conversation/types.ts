import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import type { AIMessagePartData } from '../message-parts/types';

/** Who wrote a message: the person using the app (`user`) or the agent (`assistant`). */
export type AIMessageRole = 'user' | 'assistant' | (string & {});

/**
 * A message of the conversation as the AI components show it. The counterpart of the
 * `AIMessage` protocol in StreamChatAI. `fromStreamMessage` makes one from a Stream message.
 */
export type AIMessage = {
  id: string;
  /** Who wrote it. Each of the person's messages starts a turn. */
  role: AIMessageRole;
  /** What it says. A reply's text is Markdown. */
  text: string;
  /** What it carries besides its text, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  /** Whether the agent is still writing it. */
  isGenerating?: boolean;
  /** The steps the agent took for it, in order: reasoning, tool calls and kinds of its own. */
  parts?: AIMessagePartData[];
  /**
   * The whole of a reasoning step's thinking when the app has it, such as from live updates.
   * Without it, the step shows its own excerpt. It is read on every render, so look it up
   * rather than work it out.
   */
  reasoningText?: (stepId: string) => string | undefined;
};

/**
 * A message the person sent that is not in the conversation's messages yet. The conversation
 * shows it until its copy arrives, and shows the agent thinking meanwhile.
 */
export type AIPendingMessage = {
  /**
   * The message's id once it arrives, when you know it (such as the id you send it with). Its
   * copy is then found by it rather than by where it lands. Keep it the same while it waits.
   */
  id: string;
  /** What the person wrote. */
  text: string;
  /** What they sent with it, such as the photos and files they picked. Its copy shows these too. */
  attachments?: AIMessageAttachmentData[];
};
