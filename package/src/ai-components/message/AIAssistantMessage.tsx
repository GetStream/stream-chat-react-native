import React, { type ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AIMessageAttachment,
  type AIMessageAttachmentData,
  type AIMessageAttachmentProps,
} from './AIMessageAttachment';

import { useTheme } from '../contexts';
import { AIMessageParts } from '../message-parts/AIMessageParts';
import type { AIMessagePartData } from '../message-parts/types';
import { StreamingMessageView } from '../StreamingMessageView';
import type { AIToolApprover } from '../tool-calls/AIToolApprover';

export type AIAssistantMessageProps = {
  /** The answer, in Markdown. */
  text: string;
  /**
   * Who answers tool calls' questions and sign-ins on this device, to ask them. Defaults to the
   * one of the nearest `AIToolApproverProvider`.
   */
  approver?: AIToolApprover;
  /** Shows each attachment, instead of `AIMessageAttachment`, such as for a kind of your own. */
  Attachment?: ComponentType<AIMessageAttachmentProps>;
  /** What the agent sent with it, such as images and files. */
  attachments?: AIMessageAttachmentData[];
  /**
   * The message's id. The steps keep their state for it, such as a reasoning step opened by
   * hand, and start afresh for another, as when a list reuses this view for another reply. Step
   * ids are only unique within a message.
   */
  id?: string;
  /** Whether the agent is still writing it. The text that arrives meanwhile is typed out. */
  isGenerating?: boolean;
  /** Opens a link in the answer, instead of the system's handler. */
  onLink?: (url: string) => void;
  /** Called when the answer starts or stops being typed out. */
  onWritingChange?: (isWriting: boolean) => void;
  /** The steps the agent took, in order, shown before the answer. */
  parts?: AIMessagePartData[];
  /** The whole of a reasoning step's thinking, when the app has it. */
  reasoningText?: (stepId: string) => string | undefined;
};

/**
 * The agent's reply: its steps (reasoning, tool calls and their questions), then its answer,
 * typed out as it streams in, then what it sent with it. The counterpart of
 * `AIAssistantMessageView`.
 */
export const AIAssistantMessage = ({
  approver,
  Attachment = AIMessageAttachment,
  attachments = [],
  id,
  isGenerating = false,
  onLink,
  onWritingChange,
  parts = [],
  reasoningText,
  text,
}: AIAssistantMessageProps) => {
  const {
    theme: { message },
  } = useTheme();
  const styles = message?.assistantMessage;
  return (
    <View
      accessibilityState={{ busy: isGenerating }}
      style={[defaultStyles.container, styles?.container]}
      testID='ai-assistant-message'
    >
      {parts.length > 0 ? (
        <AIMessageParts approver={approver} key={id} parts={parts} reasoningText={reasoningText} />
      ) : null}
      {/* What arrives after mount is typed out; a reply loaded from history shows at once. */}
      {text !== '' ? (
        <StreamingMessageView onLink={onLink} onWritingChange={onWritingChange} text={text} />
      ) : null}
      {attachments.length > 0 ? (
        <View style={[defaultStyles.attachments, styles?.attachments]}>
          {attachments.map((attachment, index) => (
            <Attachment attachment={attachment} key={index} role='assistant' />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const defaultStyles = StyleSheet.create({
  attachments: { alignItems: 'flex-start', gap: 8 },
  container: { gap: 8 },
});
