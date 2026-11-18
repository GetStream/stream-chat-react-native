import type { AIUIDocument } from '../generative-ui/AIUIDocument';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import type { AIMessageRating } from '../message/AIReplyActions';
import type { AIMessagePartData } from '../message-parts/types';

/** Who wrote a message: the person using the app (`user`) or the agent (`assistant`). */
export type AIMessageRole = 'user' | 'assistant' | (string & {});

/**
 * Which version of a message shows, when the agent's reply was written again (`reply`) or the
 * person's question was edited (`question`). `index` is 1-based, from 1 to `count`.
 */
export type AIMessageBranch = {
  /** How many versions there are. */
  count: number;
  /** Which version this is, from 1 to `count`. */
  index: number;
  /**
   * Whose versions they are: `reply` for the replies to one question (the switcher goes on the
   * reply), `question` for the person's edits of a question (it goes on their message).
   */
  of: 'reply' | 'question';
};

/**
 * A message of the conversation as the AI components show it. `fromStreamMessage` makes one
 * from a Stream message.
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
  /**
   * How the person rated a reply, as your backend has it. An `AIConversationController` shows it
   * until the person rates the reply on this device.
   */
  rating?: AIMessageRating | null;
  /** The steps the agent took for it, in order: reasoning, tool calls and kinds of its own. */
  parts?: AIMessagePartData[];
  /**
   * The whole of a reasoning step's thinking when the app has it, such as from live updates.
   * Without it, the step shows its own excerpt. It is read on every render, so look it up
   * rather than work it out.
   */
  reasoningText?: (stepId: string) => string | undefined;
  /**
   * The UI the agent wrote for a reply, which shows in place of its text when the
   * conversation's `ui` host has a renderer for it. A person's message has none.
   */
  uiDocument?: AIUIDocument;
  /** The id of the agent response the message belongs to, when the backend gives one. */
  responseId?: string;
  /**
   * Which of its versions the message is, when it has several. Without it, the message has one
   * version. Pass it on to `replyActions` (`of: 'reply'`) or `userMessageActions`
   * (`of: 'question'`) as `branch`, with how to show the others.
   */
  branch?: AIMessageBranch;
  /**
   * The id of the message this one is a copy of, when the backend re-sent it under a new id, as
   * it does when it brings an earlier version of the conversation back before answering on it.
   * A copy is never a request's reply.
   */
  resentFrom?: string;
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
