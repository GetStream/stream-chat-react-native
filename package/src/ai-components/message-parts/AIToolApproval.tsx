import React, { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { callStateOf, setCallState, useCallState } from './callStates';
import { isAwaitingApproval } from './parseMessageParts';
import { formatToolArguments } from './toolArguments';
import type { AIToolApprovalData, AIToolCallPart } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { primitives } from '../internal/tokens';
import { type AIToolApprover, useAIToolApprover } from '../tool-calls/AIToolApprover';

/** Where the person's answer to a tool call's question is. */
export type AIToolApprovalState = {
  /** The answer couldn't be sent, and the person can answer again. */
  failed: boolean;
  /** The answer is on its way, or arrived and the call's step hasn't changed yet. */
  isSending: boolean;
};

const idle: AIToolApprovalState = { failed: false, isSending: false };

/** The agent's reason, as a sentence, then what allowing it shares. */
export const approvalLines = (approval: AIToolApprovalData) => {
  const lines: string[] = [];
  const reason = approval.reason?.trim();
  if (reason) {
    const sentence = reason[0].toUpperCase() + reason.slice(1);
    lines.push(/[.!?…]$/.test(sentence) ? sentence : `${sentence}.`);
  }
  if (approval.message) lines.push(approval.message);
  return lines;
};

// Arguments longer than this start folded, so the question and its buttons stay in view.
const LONG_ARGUMENTS_CHARACTERS = 280;
const LONG_ARGUMENTS_LINES = 6;

export type AIToolArgumentsProps = {
  /** The call's arguments, such as `part.arguments`. */
  args: unknown;
};

/**
 * What a tool call sends, so the person sees it before they allow the call: its arguments as
 * indented JSON, under "What it sends", folded when they are long. Nothing for a call that
 * sends nothing.
 */
export const AIToolArguments = ({ args }: AIToolArgumentsProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const { Chevron } = useAIIcons();
  const card = messageParts?.approvalCard;
  const text = formatToolArguments(args);
  const isLong =
    !!text &&
    (text.length > LONG_ARGUMENTS_CHARACTERS || text.split('\n').length > LONG_ARGUMENTS_LINES);
  const [isOpen, setIsOpen] = useState(false);
  if (!text) return null;

  const label = t('What it sends');
  const code = (
    <Text selectable style={[styles.argumentsCode, { color: colors.black }, card?.argumentsCode]}>
      {text}
    </Text>
  );
  return (
    <View
      style={[styles.arguments, { backgroundColor: colors.grey_whisper }, card?.arguments]}
      testID='ai-tool-arguments'
    >
      {isLong ? (
        <Pressable
          accessibilityLabel={label}
          accessibilityRole='button'
          accessibilityState={{ expanded: isOpen }}
          hitSlop={8}
          onPress={() => setIsOpen((open) => !open)}
          style={styles.argumentsHeader}
        >
          <Text style={[styles.argumentsLabel, { color: colors.grey }, card?.argumentsLabel]}>
            {label}
          </Text>
          <View style={isOpen ? styles.chevronOpen : undefined}>
            <Chevron color={colors.grey} size={12} />
          </View>
        </Pressable>
      ) : (
        <Text style={[styles.argumentsLabel, { color: colors.grey }, card?.argumentsLabel]}>
          {label}
        </Text>
      )}
      {!isLong || isOpen ? code : null}
    </View>
  );
};

export type AIToolApprovalCardProps = {
  approval: AIToolApprovalData;
  /** Called with the person's answer. */
  onDecide: (allowed: boolean) => void;
  /** What the call sends, shown under the question, such as an `AIToolArguments`. */
  argumentsPreview?: ReactNode;
  state?: AIToolApprovalState;
};

/**
 * Asks the person a tool call's question, such as "Share your location?", with the agent's
 * reason and what allowing it shares, and an Allow and a Don't Allow button. Used inline under
 * a step by `AIToolApproval`, and on its own, such as on a voice call.
 */
export const AIToolApprovalCard = ({
  approval,
  argumentsPreview,
  onDecide,
  state = idle,
}: AIToolApprovalCardProps) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, messageParts },
  } = useTheme();
  const card = messageParts?.approvalCard;

  return (
    <View
      accessibilityState={{ busy: state.isSending }}
      style={[
        styles.container,
        { backgroundColor: colors.white, borderColor: colors.grey_gainsboro },
        card?.container,
      ]}
      testID='ai-tool-approval-card'
    >
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.black }, card?.title]}>{approval.title}</Text>
        {approvalLines(approval).map((line) => (
          <Text key={line} style={[styles.message, { color: colors.grey }, card?.message]}>
            {line}
          </Text>
        ))}
      </View>
      {argumentsPreview ?? null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: state.isSending }}
          disabled={state.isSending}
          onPress={() => onDecide(true)}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.accent_blue, opacity: pressed ? 0.7 : 1 },
            card?.allowButton,
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.white }, card?.allowButtonText]}>
            {approval.allowTitle ?? t('Allow')}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole='button'
          accessibilityState={{ disabled: state.isSending }}
          disabled={state.isSending}
          onPress={() => onDecide(false)}
          style={({ pressed }) => [
            styles.button,
            styles.declineButton,
            { borderColor: colors.grey_gainsboro, opacity: pressed ? 0.7 : 1 },
            card?.declineButton,
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.black }, card?.declineButtonText]}>
            {approval.declineTitle ?? t("Don't Allow")}
          </Text>
        </Pressable>
        {state.isSending ? <ActivityIndicator color={colors.grey} size='small' /> : null}
      </View>
      {state.failed ? (
        <Text
          accessibilityRole='alert'
          style={[styles.failure, { color: colors.accent_red }, card?.failure]}
        >
          {t("Your answer couldn't be sent. Try again.")}
        </Text>
      ) : null}
    </View>
  );
};

export type AIToolApprovalProps = {
  part: AIToolCallPart;
  /** Who answers on this device. Defaults to the one of the nearest `AIToolApproverProvider`. */
  approver?: AIToolApprover;
  /**
   * Renders the question, instead of `AIToolApprovalCard`, with what the call sends as the
   * approver previews it, or `null` when there is nothing to show.
   */
  children?: (
    approval: AIToolApprovalData,
    state: AIToolApprovalState,
    decide: (allowed: boolean) => void,
    argumentsPreview: ReactNode,
  ) => ReactNode;
};

/**
 * Asks the question of a tool call that waits for this person on this device, and sends their
 * answer with `approver.decide`. Until the call's step changes the buttons wait; a failed send
 * lets them answer again. Renders nothing for a call that does not wait for them here.
 */
export const AIToolApproval = ({ approver: approverProp, children, part }: AIToolApprovalProps) => {
  const approver = useAIToolApprover(approverProp);
  // Kept by call, not by view: a list that reuses or remounts the row keeps the answer sent.
  const key = `approval:${part.id}`;
  const state = useCallState(key, idle);
  const isWaiting =
    !!approver && !!part.approval && isAwaitingApproval(part, approver.userId, approver.clientId);
  // Once the call's step changes, there is nothing left to keep.
  useEffect(() => {
    if (!isWaiting) setCallState(key, idle, idle);
  }, [isWaiting, key]);

  if (!approver || !part.approval || !isWaiting) return null;

  const decide = (allowed: boolean) => {
    // Read where it stands now: a second tap in the same frame must not answer twice.
    if (callStateOf(key, idle).isSending) return;
    setCallState(key, { failed: false, isSending: true }, idle);
    approver
      .decide(part, allowed)
      .catch(() => setCallState(key, { failed: true, isSending: false }, idle));
  };

  const argumentsPreview = toolArgumentsPreview(part, approver);

  return (
    <>
      {children ? (
        children(part.approval, state, decide, argumentsPreview)
      ) : (
        <AIToolApprovalCard
          approval={part.approval}
          argumentsPreview={argumentsPreview}
          onDecide={decide}
          state={state}
        />
      )}
    </>
  );
};

// What the call sends, as the approver previews it, else its arguments.
const toolArgumentsPreview = (call: AIToolCallPart, approver: AIToolApprover): ReactNode => {
  const own = approver.argumentsPreview?.(call);
  if (own !== undefined) return own;
  return formatToolArguments(call.arguments) === undefined ? null : (
    <AIToolArguments args={call.arguments} />
  );
};

const styles = StyleSheet.create({
  arguments: { borderRadius: 12, gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  argumentsCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: primitives.typographyFontSizeXs,
  },
  argumentsHeader: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  argumentsLabel: { fontSize: primitives.typographyFontSizeXs, fontWeight: '600' },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    alignItems: 'center',
    borderRadius: 9999,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  buttonText: { fontSize: primitives.typographyFontSizeSm, fontWeight: '600' },
  container: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 12 },
  declineButton: { borderWidth: 1 },
  failure: { fontSize: primitives.typographyFontSizeXs },
  message: {
    fontSize: primitives.typographyFontSizeXs,
    lineHeight: primitives.typographyLineHeightNormal,
  },
  text: { gap: 4 },
  title: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: '600',
    lineHeight: primitives.typographyLineHeightNormal,
  },
});
