import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AIToolApproval } from './AIToolApproval';
import { AIToolAuthorization } from './AIToolAuthorization';
import { AIToolCall } from './AIToolCall';
import type { AIMessagePartData } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { AIReasoning } from '../reasoning/AIReasoning';
import type { AIToolApprover } from '../tool-calls/AIToolApprover';

export type AIMessagePartProps = {
  part: AIMessagePartData;
  /**
   * Who answers tool calls' questions on this device, to ask them. Defaults to the one of the
   * nearest `AIToolApproverProvider`.
   */
  approver?: AIToolApprover;
  /** The whole of a reasoning step's thinking, when the app has it. */
  reasoningText?: (stepId: string) => string | undefined;
};

/**
 * One step of a reply: a round of reasoning (`AIReasoning`), a tool call (`AIToolCall`, with its
 * question or sign-in when it waits for this person here), or a neutral line for a step this SDK can't
 * show. The counterpart of `AIMessagePartView`.
 */
export const AIMessagePart = ({ approver, part, reasoningText }: AIMessagePartProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const { Info } = useAIIcons();

  if (part.reasoning) {
    return <AIReasoning part={part.reasoning} reasoningText={reasoningText} />;
  }
  if (part.toolCall) {
    return (
      <View style={styles.tool}>
        <AIToolCall part={part.toolCall} />
        <AIToolApproval approver={approver} part={part.toolCall} />
        <AIToolAuthorization approver={approver} part={part.toolCall} />
      </View>
    );
  }
  return (
    <View style={[styles.unsupported, messageParts?.unsupported?.container]}>
      <Info color={colors.grey} />
      <Text
        style={[styles.unsupportedText, { color: colors.grey }, messageParts?.unsupported?.text]}
      >
        {t("A step this app version can't show")}
      </Text>
    </View>
  );
};

export type AIMessagePartsProps = Omit<AIMessagePartProps, 'part'> & {
  parts: AIMessagePartData[];
  /** Renders a step, instead of `AIMessagePart`. */
  children?: (part: AIMessagePartData) => ReactNode;
};

/** The steps of a reply, in order. The counterpart of `AIMessagePartsView`. */
export const AIMessageParts = ({
  approver,
  children,
  parts,
  reasoningText,
}: AIMessagePartsProps) => {
  const {
    theme: { messageParts },
  } = useTheme();
  return (
    <View style={[styles.parts, messageParts?.container]} testID='ai-message-parts'>
      {parts.map((part) => (
        <View key={part.id}>
          {children ? (
            children(part)
          ) : (
            <AIMessagePart approver={approver} part={part} reasoningText={reasoningText} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  parts: { gap: 8, width: '100%' },
  tool: { gap: 8 },
  unsupported: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  unsupportedText: { flexShrink: 1, fontSize: 14 },
});
