import React, { memo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FINISHED_REASONING_SHOWN_MS, useAIThinkingTurn } from './thinkingClock';

import type { ScrollViewRef } from '../../types/react-native-compat';
import { type DeepPartial, StreamTheme, useAITranslation, useTheme } from '../contexts';
import { formatMinutesAndSeconds, useNow } from '../internal/format';
import { ChevronIcon, ReasoningIcon } from '../internal/icons/AgentIcons';
import { Shimmer } from '../internal/Shimmer';
import { Markdown } from '../markdown';
import type { AIReasoningPart } from '../message-parts/types';
import type { Theme } from '../theme';

/**
 * Splits reasoning at blank lines. Reasoning only grows at its end, so a paragraph's position
 * is a stable identity.
 */
export const splitReasoningParagraphs = (text: string) =>
  text
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

// A heading reads as a bold line, since a paragraph of thinking has no document to structure.
const headingsAsBold = (paragraph: string) =>
  paragraph
    .split('\n')
    .map((line) => {
      const heading = /^ *#+\s*(.*)$/.exec(line)?.[1]?.trim();
      return heading ? `**${heading}**` : line;
    })
    .join('\n');

const ReasoningParagraph = memo(({ text }: { text: string }) => (
  <Markdown>{headingsAsBold(text)}</Markdown>
));
ReasoningParagraph.displayName = 'ReasoningParagraph';

// Reveals text that grows a little at a time, a sixth of the backlog every frame at 30 fps, as
// new thoughts arrive about that often. Text that is replaced, or not animated, shows at once.
const useTextReveal = (text: string, animated: boolean) => {
  const [shown, setShown] = useState(text);
  const shownRef = useRef(text);
  const targetRef = useRef(text);

  useEffect(() => {
    const grows = animated && text.startsWith(shownRef.current);
    targetRef.current = text;
    if (!grows) {
      shownRef.current = text;
      setShown(text);
      return;
    }
    const timer = setInterval(() => {
      const target = targetRef.current;
      const current = shownRef.current;
      if (current.length >= target.length) {
        clearInterval(timer);
        return;
      }
      let end = current.length + Math.max(1, Math.floor((target.length - current.length) / 6));
      // never split a surrogate pair
      const code = target.charCodeAt(end - 1);
      if (code >= 0xd800 && code <= 0xdbff) end += 1;
      shownRef.current = target.slice(0, end);
      setShown(shownRef.current);
    }, 1000 / 30);
    return () => clearInterval(timer);
  }, [animated, text]);

  return shown;
};

const ReasoningPanel = ({
  isLive,
  maxHeight,
  text,
}: {
  isLive: boolean;
  maxHeight: number;
  text: string;
}) => {
  const shown = useTextReveal(text, isLive);
  const scrollerRef = useRef<ScrollViewRef>(null);
  // Whether the reader is at the end, so new thoughts keep it there. A finished trace opens at
  // its start.
  const following = useRef(isLive);
  const {
    theme: { messageParts },
  } = useTheme();

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    following.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;
  };

  return (
    <ScrollView
      nestedScrollEnabled
      onContentSizeChange={() => {
        if (following.current) scrollerRef.current?.scrollToEnd({ animated: false });
      }}
      onScroll={onScroll}
      ref={scrollerRef}
      scrollEventThrottle={32}
      style={[{ maxHeight }, messageParts?.reasoning?.panel]}
    >
      {splitReasoningParagraphs(shown).map((paragraph, index) => (
        <ReasoningParagraph key={index} text={paragraph} />
      ))}
    </ScrollView>
  );
};

export type AIReasoningProps = {
  /** How long the model has thought, in seconds, shown as "Thought for 12s" once it is done. */
  duration?: number;
  /** A note under the open reasoning, such as how long it is kept. */
  footnote?: ReactNode;
  /** Whether the reasoning is open once the model is done. Defaults to `false`. */
  initiallyExpanded?: boolean;
  /** Whether the model is still thinking. Defaults to whether `part` is streaming. */
  isThinking?: boolean;
  /** How tall the reasoning grows, in points, before it scrolls. Defaults to 260. */
  maxExpandedHeight?: number;
  /** A reasoning step, whose preview, summary, status and duration it shows. */
  part?: AIReasoningPart;
  /**
   * The whole of a reasoning step's thinking when the app has it, such as from live updates.
   * Read on every render; without it, the step shows its own preview.
   */
  reasoningText?: (stepId: string) => string | undefined;
  /** Whether the reasoning is open while the model thinks. Defaults to `true`. */
  showsLiveReasoning?: boolean;
  /** When the thinking began (`Date.now()`), for a header that counts from before it appeared. */
  since?: number;
  /** A one-line summary shown beside the header once the model is done. */
  summary?: string;
  /**
   * The reasoning so far. Blank lines separate paragraphs, and Markdown is rendered. Defaults to
   * `reasoningText(part.id)`, else the step's preview or summary.
   */
  text?: string;
};

const opensByDefault = (
  isThinking: boolean,
  showsLiveReasoning: boolean,
  initiallyExpanded: boolean,
) => (isThinking ? showsLiveReasoning : initiallyExpanded);

/**
 * A round of the model's reasoning: a header that counts the seconds while it thinks ("Thinking...
 * 7s") and says how long it thought once done ("Thought for 12s"), over the reasoning itself,
 * which streams into view while the model thinks and folds away when it is done. Pressing the
 * header opens or folds it. The counterpart of `StreamingReasoningView`.
 *
 * Inside an `AIConversation` that showed the agent thinking, the reply's first reasoning step
 * takes over that thinking: its seconds count from when the question was asked.
 */
export const AIReasoning = ({
  duration: durationProp,
  footnote,
  initiallyExpanded = false,
  isThinking: isThinkingProp,
  maxExpandedHeight = 260,
  part,
  reasoningText,
  showsLiveReasoning = true,
  since,
  summary: summaryProp,
  text: textProp,
}: AIReasoningProps) => {
  const { t, userLanguage } = useAITranslation();
  const { theme } = useTheme();
  const { colors, messageParts } = theme;
  const reasoningStyle = messageParts?.reasoning;
  const turn = useAIThinkingTurn();

  const text =
    textProp ??
    (part ? (reasoningText?.(part.id) ?? part.preview ?? part.summary) : undefined) ??
    '';
  const isThinking = isThinkingProp ?? part?.status === 'streaming';
  const ownDuration =
    durationProp ?? (part?.durationMs !== undefined ? part.durationMs / 1000 : undefined);
  const summary = summaryProp ?? part?.summary;

  // The turn whose thinking this step takes over, when it is the first step of a turn that was
  // seen thinking.
  const thinkingTurn =
    part && turn && turn.firstStepId === part.id && turn.clock.start(turn.key) !== undefined
      ? turn
      : undefined;
  const clock = thinkingTurn?.clock;
  const turnKey = thinkingTurn?.key;
  useEffect(() => {
    if (isThinking && clock && turnKey !== undefined) clock.firstStepStreams(turnKey);
  }, [clock, isThinking, turnKey]);

  // What the reader chose by pressing the header. Until they do, the reasoning is open while
  // the model thinks and folded once it is done.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [open, setOpen] = useState(() =>
    opensByDefault(isThinking, showsLiveReasoning, initiallyExpanded),
  );
  const [thinkingSince, setThinkingSince] = useState(() => since ?? Date.now());
  const [thoughtFor, setThoughtFor] = useState<number>();

  // A conversation's first step that arrived done, with the answer, shows its reasoning before
  // it folds: the model sent none of it while it thought.
  const [showsFinished] = useState(
    () =>
      !isThinking &&
      text !== '' &&
      !!thinkingTurn &&
      thinkingTurn.clock.showsFirstStep(thinkingTurn.key),
  );
  useEffect(() => {
    if (!showsFinished) return;
    setOpen(true);
    const timer = setTimeout(() => setOpen(false), FINISHED_REASONING_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [showsFinished]);

  const wasThinking = useRef(isThinking);
  useEffect(() => {
    if (wasThinking.current === isThinking) return;
    wasThinking.current = isThinking;
    if (isThinking) {
      setThinkingSince(Date.now());
    } else {
      if (clock && turnKey !== undefined) clock.firstStepDone(turnKey, ownDuration);
      setThoughtFor(Math.max(ownDuration ?? 0, (Date.now() - thinkingSince) / 1000));
    }
    setOpen(choice ?? opensByDefault(isThinking, showsLiveReasoning, initiallyExpanded));
  }, [
    choice,
    clock,
    initiallyExpanded,
    isThinking,
    ownDuration,
    showsLiveReasoning,
    thinkingSince,
    turnKey,
  ]);

  const start = since ?? (thinkingTurn ? thinkingTurn.clock.start(thinkingTurn.key) : undefined);
  const now = useNow(isThinking);
  const elapsed = Math.max(ownDuration ?? 0, (now - (start ?? thinkingSince)) / 1000);
  const measured =
    !isThinking && thinkingTurn
      ? thinkingTurn.clock.durationOfFirstStep(thinkingTurn.key, ownDuration)
      : undefined;
  const thought = measured ?? ownDuration ?? thoughtFor;

  const title = isThinking
    ? elapsed >= 1
      ? t('Thinking... {{ duration }}', {
          duration: formatMinutesAndSeconds(elapsed, userLanguage),
        })
      : t('Thinking...')
    : thought !== undefined
      ? t('Thought for {{ duration }}', {
          duration: formatMinutesAndSeconds(Math.max(1, thought), userLanguage),
        })
      : t('Thought process');

  // Live reasoning is open before any of it arrives, but there is nothing to show until then.
  const expanded = open && text !== '';

  // The reasoning reads in the secondary colour, a little smaller than an answer.
  const panelStyle = useMemo<DeepPartial<Theme>>(
    () => ({
      markdown: {
        paragraph: { marginBottom: 4, marginTop: 4 },
        text: { color: colors.grey, fontSize: 14, lineHeight: 20 },
      },
    }),
    [colors.grey],
  );

  return (
    <View
      style={[
        styles.container,
        { borderStartColor: isThinking ? colors.accent_blue : colors.grey_gainsboro },
        reasoningStyle?.container,
      ]}
      testID='ai-reasoning'
    >
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ expanded }}
        onPress={() => {
          setChoice(!expanded);
          setOpen(!expanded);
        }}
        style={[styles.header, reasoningStyle?.header]}
      >
        <Shimmer active={isThinking} style={styles.lead}>
          <ReasoningIcon color={colors.black} />
          <Text style={[styles.title, { color: colors.black }, reasoningStyle?.title]}>
            {title}
          </Text>
        </Shimmer>
        {summary && !isThinking && !expanded ? (
          <Text
            numberOfLines={1}
            style={[styles.summary, { color: colors.grey }, reasoningStyle?.summary]}
          >
            {summary}
          </Text>
        ) : null}
        <View
          style={{
            transform: [{ rotate: expanded ? (I18nManager.isRTL ? '-90deg' : '90deg') : '0deg' }],
          }}
        >
          <ChevronIcon color={colors.grey} size={12} />
        </View>
      </Pressable>
      {expanded ? (
        <StreamTheme style={panelStyle} theme={theme}>
          <ReasoningPanel isLive={isThinking} maxHeight={maxExpandedHeight} text={text} />
          {footnote && !isThinking && (choice === true || initiallyExpanded) ? footnote : null}
        </StreamTheme>
      ) : null}
    </View>
  );
};

export type AIThinkingProps = {
  /** When the thinking began (`Date.now()`). Inside an `AIConversation`, when the question was asked. */
  since?: number;
};

/**
 * The agent thinking before its reply shows anything: a header that counts the seconds. In an
 * `AIConversation`, the reply's first reasoning step takes over its seconds. The counterpart of
 * `AIThinkingView`.
 */
export const AIThinking = ({ since }: AIThinkingProps) => {
  const turn = useAIThinkingTurn();
  return (
    <AIReasoning
      isThinking
      since={since ?? (turn ? turn.clock.start(turn.key) : undefined)}
      text=''
    />
  );
};

const styles = StyleSheet.create({
  container: { borderStartWidth: 2, gap: 4, paddingStart: 12 },
  header: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
  },
  lead: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  summary: { flexShrink: 1, fontSize: 14 },
  title: { fontSize: 14, fontVariant: ['tabular-nums'], fontWeight: '500' },
});
