import React, {
  memo,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import Animated, {
  makeMutable,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { FINISHED_REASONING_SHOWN_MS, useAIThinkingTurn } from './thinkingClock';

import type { ScrollViewRef } from '../../types/react-native-compat';
import { type DeepPartial, StreamTheme, useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { formatMinutesAndSeconds, useNow } from '../internal/format';
import { Shimmer } from '../internal/Shimmer';
import { primitives } from '../internal/tokens';
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
  /**
   * Which step this is, across a conversation: when it changes, the view starts afresh, as for
   * another reply's step when a list reuses it. Defaults to `part.id`, which is only unique within
   * a message: `AIMessageParts` passes the message's id with it.
   */
  stepKey?: string;
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

// A spring with a response of 0.45 and a damping fraction of 0.95: a stiffness of
// (2π / 0.45)² and a damping of 2 × 0.95 × √stiffness. With Reduce Motion it folds at once.
const FOLD_SPRING = { damping: 26.5, mass: 1, stiffness: 195 };

// The chevron turns with the fold.
const FoldChevron = ({
  children,
  progress,
}: {
  children: ReactNode;
  progress: SharedValue<number>;
}) => {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * (I18nManager.isRTL ? -90 : 90)}deg` }],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
};

// The open reasoning, which springs open and folded with `progress`, and says when it has folded.
const Fold = ({
  children,
  expanded,
  onFolded,
  progress,
  step,
}: {
  children: ReactNode;
  expanded: boolean;
  onFolded: (mounted: false) => void;
  progress: SharedValue<number>;
  step: string | undefined;
}) => {
  const panelHeight = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(expanded ? 1 : 0, FOLD_SPRING, (finished) => {
      if (finished && !expanded) runOnJS(onFolded)(false);
    });
  }, [expanded, onFolded, progress, step]);
  const style = useAnimatedStyle(() => ({
    height: panelHeight.value * progress.value,
    opacity: progress.value,
  }));
  return (
    <Animated.View
      accessibilityElementsHidden={!expanded}
      importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      style={[styles.fold, style]}
    >
      <View
        onLayout={({ nativeEvent }) => {
          panelHeight.value = nativeEvent.layout.height;
        }}
        style={styles.panel}
      >
        {children}
      </View>
    </Animated.View>
  );
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
 * header opens or folds it.
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
  stepKey: stepKeyProp,
  summary: summaryProp,
  text: textProp,
}: AIReasoningProps) => {
  const { t, userLanguage } = useAITranslation();
  const { theme } = useTheme();
  const { Chevron, Reasoning } = useAIIcons();
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

  const opensFirst = () => opensByDefault(isThinking, showsLiveReasoning, initiallyExpanded);
  // A conversation's first step that arrived done, with the answer, shows its reasoning before
  // it folds: the model sent none of it while it thought.
  const showsWhenFinished = () =>
    !isThinking &&
    text !== '' &&
    !!thinkingTurn &&
    thinkingTurn.clock.showsFirstStep(thinkingTurn.key);

  // What the reader chose by pressing the header. Until they do, the reasoning is open while
  // the model thinks and folded once it is done.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [open, setOpen] = useState(opensFirst);
  const [thinkingSince, setThinkingSince] = useState(() => since ?? Date.now());
  const [thoughtFor, setThoughtFor] = useState<number>();
  const [showsFinished, setShowsFinished] = useState(showsWhenFinished);
  // The panel shrinks in place as it folds, so what is below it glides up rather than jumps, and
  // goes once folded. Live reasoning joins at no height and unfolds; a finished trace that opens
  // with the step shows at once.
  const [mounted, setMounted] = useState(() => opensFirst() && text !== '');
  // How far the fold is open, made the first time the step opens: most steps, such as those of
  // replies from history, are never opened, and a list that scrolls fast mounts them all the time.
  const [startsOpen, setStartsOpen] = useState(() => opensFirst() && text !== '' && !isThinking);
  const progressRef = useRef<SharedValue<number>>(undefined);
  const wasThinking = useRef(isThinking);

  // Another step, such as another reply's when a list reuses this view: everything above starts
  // again from it, as a view mounted for it would.
  const stepKey = stepKeyProp ?? part?.id;
  const [shownStep, setShownStep] = useState(stepKey);
  const isNewStep = shownStep !== stepKey;
  if (isNewStep) {
    const opens = opensFirst() && text !== '';
    setShownStep(stepKey);
    setChoice(null);
    setOpen(opensFirst());
    setThinkingSince(since ?? Date.now());
    setThoughtFor(undefined);
    setShowsFinished(showsWhenFinished());
    setMounted(opens);
    setStartsOpen(opens && !isThinking);
    wasThinking.current = isThinking;
  }
  useLayoutEffect(() => {
    if (progressRef.current) progressRef.current.value = startsOpen ? 1 : 0;
  }, [shownStep, startsOpen]);

  useEffect(() => {
    if (!showsFinished) return;
    setOpen(true);
    const timer = setTimeout(() => setOpen(false), FINISHED_REASONING_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [showsFinished, shownStep]);

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
      ? t('aiComponents.reasoning.thinkingFor.title', 'Thinking... {{ duration }}', {
          duration: formatMinutesAndSeconds(elapsed, userLanguage),
        })
      : t('aiComponents.reasoning.thinking.title', 'Thinking...')
    : thought !== undefined
      ? t('aiComponents.reasoning.thoughtFor.title', 'Thought for {{ duration }}', {
          duration: formatMinutesAndSeconds(Math.max(1, thought), userLanguage),
        })
      : t('aiComponents.reasoning.thoughtProcess.title', 'Thought process');

  // Live reasoning is open before any of it arrives, but there is nothing to show until then.
  const expanded = open && text !== '';

  // Not while this render is for the step shown before: it renders again for the new one at once.
  if (!isNewStep && expanded && !mounted) setMounted(true);
  if (!isNewStep && mounted && !progressRef.current) {
    progressRef.current = makeMutable(startsOpen ? 1 : 0);
  }
  const progress = progressRef.current;

  // The reasoning reads in the secondary colour, a little smaller than an answer.
  const panelStyle = useMemo<DeepPartial<Theme>>(
    () => ({
      markdown: {
        paragraph: { marginBottom: 4, marginTop: 4 },
        text: {
          color: colors.grey,
          fontSize: primitives.typographyFontSizeSm,
          lineHeight: primitives.typographyLineHeightNormal,
        },
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
          <Reasoning color={colors.black} />
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
        {progress ? (
          <FoldChevron progress={progress}>
            <Chevron color={colors.grey} size={12} />
          </FoldChevron>
        ) : (
          <Chevron color={colors.grey} size={12} />
        )}
      </Pressable>
      {progress && mounted && text !== '' ? (
        <Fold expanded={expanded} onFolded={setMounted} progress={progress} step={shownStep}>
          <StreamTheme style={panelStyle} theme={theme}>
            <ReasoningPanel isLive={isThinking} maxHeight={maxExpandedHeight} text={text} />
            {footnote && !isThinking && (choice === true || initiallyExpanded) ? footnote : null}
          </StreamTheme>
        </Fold>
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
 * `AIConversation`, the reply's first reasoning step takes over its seconds.
 */
export const AIThinking = ({ since }: AIThinkingProps) => {
  const turn = useAIThinkingTurn();
  const start = since ?? (turn ? turn.clock.start(turn.key) : undefined);
  return (
    <AIReasoning
      isThinking
      since={start}
      stepKey={start === undefined ? undefined : `thinking:${start}`}
      text=''
    />
  );
};

const styles = StyleSheet.create({
  container: { borderStartWidth: 2, paddingStart: 12 },
  fold: { overflow: 'hidden' },
  header: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    maxWidth: '100%',
  },
  lead: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  panel: { left: 0, paddingTop: 4, position: 'absolute', right: 0, top: 0 },
  summary: { flexShrink: 1, fontSize: primitives.typographyFontSizeSm },
  title: {
    fontSize: primitives.typographyFontSizeSm,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
});
