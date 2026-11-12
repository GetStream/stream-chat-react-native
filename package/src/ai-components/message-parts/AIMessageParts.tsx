import React, { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

import { AIToolApproval } from './AIToolApproval';
import { AIToolAuthorization } from './AIToolAuthorization';
import { AIToolCall } from './AIToolCall';
import type { AIMessagePartData } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { primitives } from '../internal/tokens';
import { AIReasoning } from '../reasoning/AIReasoning';
import { useAIThinkingTurn } from '../reasoning/thinkingClock';
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
  /**
   * Which step this is, across a conversation, such as its message's id with the step's: a view
   * shown for another step starts afresh. Defaults to the step's id.
   */
  stepKey?: string;
};

/**
 * One step of a reply: a round of reasoning (`AIReasoning`), a tool call (`AIToolCall`, with its
 * question or sign-in when it waits for this person here), or a neutral line for a step this SDK can't
 * show.
 */
export const AIMessagePart = ({ approver, part, reasoningText, stepKey }: AIMessagePartProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const { Info } = useAIIcons();

  if (part.reasoning) {
    return <AIReasoning part={part.reasoning} reasoningText={reasoningText} stepKey={stepKey} />;
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
        {t('aiComponents.messageParts.unsupportedStep.text', "A step this app version can't show")}
      </Text>
    </View>
  );
};

export type AIMessagePartsProps = Omit<AIMessagePartProps, 'part' | 'stepKey'> & {
  parts: AIMessagePartData[];
  /** Renders a step, instead of `AIMessagePart`. */
  children?: (part: AIMessagePartData) => ReactNode;
  /**
   * The message the steps are of. Step ids are only unique within a message: with it, a view
   * reused for another message's steps, as when a list reuses a row, updates the views it has
   * and starts each step afresh, rather than building them again.
   */
  messageId?: string;
  /** Whether the reply is being written: a step that appears meanwhile fades in. */
  isGenerating?: boolean;
};

const STEP_IN = FadeIn.duration(200).easing(Easing.out(Easing.ease));

const StepView = ({ children, comesIn }: { children: ReactNode; comesIn: boolean }) => {
  const [animated] = useState(comesIn);
  return animated ? (
    <Animated.View entering={STEP_IN}>{children}</Animated.View>
  ) : (
    <View>{children}</View>
  );
};

/** The steps of a reply, in order. */
export const AIMessageParts = ({
  approver,
  children,
  isGenerating = false,
  messageId,
  parts,
  reasoningText,
}: AIMessagePartsProps) => {
  const {
    theme: { messageParts },
  } = useTheme();
  const turn = useAIThinkingTurn();
  const takesOverThinking = (part: AIMessagePartData) =>
    !!part.reasoning &&
    !!turn &&
    turn.firstStepId === part.id &&
    turn.clock.start(turn.key) !== undefined;
  return (
    <View style={[styles.parts, messageParts?.container]} testID='ai-message-parts'>
      {parts.map((part, index) => {
        const stepKey = messageId === undefined ? part.id : `${messageId}:${part.id}`;
        // The default steps are kept by position and start afresh for another step themselves.
        // Steps rendered by `children` keep their state by step, which only they can reset.
        return (
          <StepView
            comesIn={isGenerating && !takesOverThinking(part)}
            key={children ? stepKey : index}
          >
            {children ? (
              children(part)
            ) : (
              <AIMessagePart
                approver={approver}
                part={part}
                reasoningText={reasoningText}
                stepKey={stepKey}
              />
            )}
          </StepView>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  parts: { gap: 8, width: '100%' },
  tool: { gap: 8 },
  unsupported: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  unsupportedText: { flexShrink: 1, fontSize: primitives.typographyFontSizeSm },
});
