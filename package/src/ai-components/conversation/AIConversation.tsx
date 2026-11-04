import React, {
  type ComponentType,
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import type {
  AnchoredEndSpaceConfig,
  LegendListRef,
  LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import { AnimatedLegendList } from '@legendapp/list/reanimated';

import {
  type AIConversationEntry,
  type AIConversationTurn,
  AIPendingMessageTracker,
  turnsOf,
} from './entries';
import type { AIMessage, AIPendingMessage } from './types';

import { useAITranslation, useTheme } from '../contexts';
import { useAIIcons } from '../icons';
import { AIAssistantMessage } from '../message/AIAssistantMessage';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { AIReplyActions, type AIReplyActionsProps } from '../message/AIReplyActions';
import { AIUserMessage } from '../message/AIUserMessage';
import type { AIMessagePartData } from '../message-parts/types';
import { AIThinking } from '../reasoning/AIReasoning';
import { AIThinkingClock, AIThinkingTurnContext } from '../reasoning/thinkingClock';
import { type AIToolApprover, AIToolApproverProvider } from '../tool-calls/AIToolApprover';
import { useReduceMotion } from '../voice-visualization/useReduceMotion';

// How far from the end still counts as at the end.
const END_SLACK = 32;
// How long the spinner above the turns stays in view before older messages load, so a list that
// opens at its end does not load for the frame its start shows.
const LOAD_OLDER_DELAY_MS = 300;
// How long to wait before asking again after loading older messages failed.
const LOAD_OLDER_RETRY_MS = 3000;
// How close to the start, as a share of the list's height, the spinner counts as in view.
const START_THRESHOLD = 0.1;

// StreamChatAI's layout: turns 8 apart, each with 16 above it, its messages 16 apart, and 16
// around the whole.
const SPACING_MD = 16;
const TURN_GAP = 8 + SPACING_MD;

export type AIConversationUserMessageProps = {
  /** What the person sent with it, such as images and files. */
  attachments: AIMessageAttachmentData[];
  /** What the person wrote. */
  text: string;
  /** The message, or `undefined` for one on its way. */
  message?: AIMessage;
};

export type AIConversationAssistantMessageProps = {
  attachments: AIMessageAttachmentData[];
  isGenerating: boolean;
  message: AIMessage;
  parts: AIMessagePartData[];
  text: string;
  approver?: AIToolApprover;
  reasoningText?: (stepId: string) => string | undefined;
};

export type AIConversationReplyActionsProps = {
  /** Whether it is the reply that ends the conversation, which can be asked for again. */
  isLatestReply: boolean;
  message: AIMessage;
  text: string;
};

export type AIConversationProps = {
  /** The conversation, oldest message first. */
  messages: AIMessage[];
  /** Who answers tool calls' questions and sign-ins on this device, to ask them. */
  approver?: AIToolApprover;
  /**
   * The view of the agent's replies. Defaults to `AIAssistantMessage`.
   *
   * The list reuses its rows: a view scrolled out of sight renders another reply next, so state a
   * view keeps of its own has to start afresh for a new `message.id` (such as with a `key`).
   * The same holds for `UserMessage` and `ReplyActions`.
   */
  AssistantMessage?: ComponentType<AIConversationAssistantMessageProps>;
  /**
   * Room left under the latest turn, for a composer floating over the bottom of the conversation.
   * The question of a new turn pins to the top of what is visible above it.
   */
  bottomInset?: number;
  /** What the conversation shows while there are no messages, centered in it. */
  emptyContent?: ReactNode;
  /** A view under the latest turn's messages, such as what the agent is doing, or an error with a way to retry. */
  footer?: ReactNode;
  /**
   * Whether the agent is answering the latest message and its reply shows nothing yet.
   * Meanwhile the latest turn ends with `AIThinking`, and the reply's first reasoning step takes
   * over its seconds. The conversation also knows it is while `pendingMessage` waits, and while
   * the latest reply is being written but shows nothing.
   */
  isThinking?: boolean;
  /**
   * Loads the messages before the first one, which the conversation asks for as the person
   * scrolls to its start. It shows a spinner meanwhile, and what is on screen stays in place as
   * they arrive. Pass `undefined` once there are none left.
   */
  loadOlderMessages?: () => Promise<void> | void;
  /**
   * A message the person sent that is not in `messages` yet. Keep passing it until its reply
   * starts: the conversation stops showing it once its copy arrives.
   */
  pendingMessage?: AIPendingMessage | null;
  /** The actions under each finished reply. Defaults to `AIReplyActions`; `null` shows none. */
  ReplyActions?: ComponentType<AIConversationReplyActionsProps> | null;
  /**
   * What the default `AIReplyActions` offers for a reply besides copy and share, such as its
   * rating and how to rate or regenerate it. Every message renders again when it changes, so keep
   * it the same between renders (`useCallback`) unless what it returns changed.
   */
  replyActions?: (
    message: AIMessage,
    context: { isLatestReply: boolean },
  ) => Omit<AIReplyActionsProps, 'text'> | undefined;
  /** The view of the person's messages. Defaults to `AIUserMessage`. */
  UserMessage?: ComponentType<AIConversationUserMessageProps>;
};

const DefaultUserMessage = ({ attachments, text }: AIConversationUserMessageProps) => (
  <AIUserMessage attachments={attachments} text={text} />
);

const DefaultAssistantMessage = ({
  approver,
  attachments,
  isGenerating,
  message,
  parts,
  reasoningText,
  text,
}: AIConversationAssistantMessageProps) => (
  <AIAssistantMessage
    approver={approver}
    attachments={attachments}
    id={message.id}
    isGenerating={isGenerating}
    parts={parts}
    reasoningText={reasoningText}
    text={text}
  />
);

// What every row reads, rather than each row's item carrying it: a row renders again only when
// its item is a new object, or when this changes.
type ConversationContextValue = {
  AssistantMessage: ComponentType<AIConversationAssistantMessageProps>;
  clock: AIThinkingClock;
  ReplyActions: ComponentType<AIConversationReplyActionsProps> | null;
  UserMessage: ComponentType<AIConversationUserMessageProps>;
  approver?: AIToolApprover;
  replyActions?: AIConversationProps['replyActions'];
};

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

/**
 * Where a row is: the first of a turn, or within one. The first turn has the same room above it as
 * the others, so older messages arriving above it leave it where it is.
 */
type RowPosition = 'turn' | 'message';

/** A row of the list: one message, with the turn it belongs to. */
type EntryRow = {
  entry: AIConversationEntry;
  key: string;
  kind: 'entry';
  position: RowPosition;
  turnKey: string;
  /** The turn's first reasoning step, which takes over the seconds the turn was seen thinking. */
  firstStepId?: string;
};

/**
 * What ends the latest turn: the agent thinking, and the app's footer. A row of its own rather than
 * the list's footer: the list lays its rows out itself, together with the room it leaves under the
 * latest turn, while a footer that goes away shrinks the content at once, which moves the view.
 */
type TailRow = {
  isThinking: boolean;
  key: string;
  kind: 'tail';
  turnKey: string;
  firstStepId?: string;
  footer?: ReactNode;
};

type ConversationRow = EntryRow | TailRow;

const TAIL_KEY = 'ai-conversation-tail';

const ROW_GAPS: Record<RowPosition, number> = {
  message: SPACING_MD,
  turn: TURN_GAP,
};

const sameAttachments = (a: AIMessageAttachmentData[], b: AIMessageAttachmentData[]) =>
  a === b || (a.length === 0 && b.length === 0);

// Whether a row can be kept as it was: the list renders a row again only for a new item.
const isSameRow = (row: EntryRow, next: Omit<EntryRow, 'key'>) =>
  row.entry.message === next.entry.message &&
  row.entry.pending === next.entry.pending &&
  row.entry.isLatestReply === next.entry.isLatestReply &&
  sameAttachments(row.entry.sentAttachments, next.entry.sentAttachments) &&
  row.firstStepId === next.firstStepId &&
  row.position === next.position &&
  row.turnKey === next.turnKey;

// The turn's first reasoning step, which takes over the seconds the turn was seen thinking.
const firstStepOf = (turn: AIConversationTurn | undefined) => {
  for (const { message } of turn?.entries ?? []) {
    if (!message || message.role === 'user') continue;
    const step = message.parts?.find((part) => part.reasoning);
    if (step) return step.id;
  }
  return undefined;
};

type EntryViewProps = {
  AssistantMessage: ComponentType<AIConversationAssistantMessageProps>;
  entry: AIConversationEntry;
  ReplyActions: ComponentType<AIConversationReplyActionsProps> | null;
  UserMessage: ComponentType<AIConversationUserMessageProps>;
  approver?: AIToolApprover;
};

const EntryView = ({
  approver,
  AssistantMessage,
  entry,
  ReplyActions,
  UserMessage,
}: EntryViewProps) => {
  const { message, pending } = entry;
  if (!message) {
    return pending ? (
      <UserMessage attachments={pending.attachments ?? []} text={pending.text} />
    ) : null;
  }
  if (message.role === 'user') {
    return (
      <UserMessage
        attachments={
          entry.sentAttachments.length ? entry.sentAttachments : (message.attachments ?? [])
        }
        message={message}
        text={message.text}
      />
    );
  }
  return (
    <View style={styles.reply}>
      <AssistantMessage
        approver={approver}
        attachments={message.attachments ?? []}
        isGenerating={!!message.isGenerating}
        message={message}
        parts={message.parts ?? []}
        reasoningText={message.reasoningText}
        text={message.text}
      />
      {ReplyActions && !message.isGenerating && message.text !== '' ? (
        // Keyed: a row reused for another reply starts its actions afresh, such as not "Copied".
        <ReplyActions
          isLatestReply={entry.isLatestReply}
          key={message.id}
          message={message}
          text={message.text}
        />
      ) : null}
    </View>
  );
};

const Row = memo(({ row }: { row: ConversationRow }) => {
  const context = useContext(ConversationContext);
  const {
    theme: { conversation },
  } = useTheme();
  const clock = context?.clock;
  const turn = useMemo(
    () => (clock ? { clock, firstStepId: row.firstStepId, key: row.turnKey } : undefined),
    [clock, row.firstStepId, row.turnKey],
  );
  if (!context) return null;
  return (
    <View
      style={[
        styles.row,
        { paddingTop: row.kind === 'entry' ? ROW_GAPS[row.position] : SPACING_MD },
        conversation?.row,
      ]}
    >
      <AIThinkingTurnContext.Provider value={turn}>
        {row.kind === 'entry' ? (
          <EntryView
            approver={context.approver}
            AssistantMessage={context.AssistantMessage}
            entry={row.entry}
            ReplyActions={context.ReplyActions}
            UserMessage={context.UserMessage}
          />
        ) : (
          <>
            {row.isThinking ? <AIThinking /> : null}
            {row.footer}
          </>
        )}
      </AIThinkingTurnContext.Provider>
    </View>
  );
});
Row.displayName = 'AIConversationRow';

const renderRow = ({ item }: LegendListRenderItemProps<ConversationRow>) => <Row row={item} />;

const keyOf = (row: ConversationRow) => row.key;

// A row reused for another takes one of its kind, which renders the same views.
const typeOf = (row: ConversationRow) =>
  row.kind === 'tail' ? 'tail' : row.entry.isFromUser ? 'user' : 'assistant';

// `AIReplyActions` with what the conversation's `replyActions` offers for the reply.
const DefaultConversationReplyActions = ({
  isLatestReply,
  message,
  text,
}: AIConversationReplyActionsProps) => {
  const offered = useContext(ConversationContext)?.replyActions;
  return <AIReplyActions {...offered?.(message, { isLatestReply })} text={text} />;
};

const LoadingOlder = () => {
  const { t } = useAITranslation();
  const {
    theme: { colors, conversation },
  } = useTheme();
  return (
    <View
      accessibilityLabel={t('Loading older messages')}
      accessibilityRole='progressbar'
      accessible
      style={[styles.loadingOlder, conversation?.loadingOlder]}
    >
      <ActivityIndicator color={conversation?.loadingIndicator ?? colors.grey} />
    </View>
  );
};

const ScrollToLatestButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useAITranslation();
  const {
    theme: { colors, conversation },
  } = useTheme();
  const { ArrowDown } = useAIIcons();
  return (
    <Pressable
      accessibilityLabel={t('Scroll to latest')}
      accessibilityRole='button'
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.scrollButton,
        {
          backgroundColor: conversation?.scrollButtonBackground ?? colors.white,
          borderColor: conversation?.scrollButtonBorder ?? colors.grey_gainsboro,
          opacity: pressed ? 0.7 : 1,
        },
        conversation?.scrollButton,
      ]}
    >
      <ArrowDown color={conversation?.scrollButtonIcon ?? colors.black} size={20} />
    </Pressable>
  );
};

/**
 * The conversation with an AI agent, laid out by turn: each of the person's questions starts a
 * turn, with the agent's reply under it. The counterpart of `AIConversationView`.
 *
 * - A new question pins to the top of what is visible, and the reply writes out below it,
 *   without moving what is on screen. The latest turn is at least as tall as the conversation.
 * - It opens at the end; older messages load as the person scrolls to the start, and what is on
 *   screen stays in place as they arrive.
 * - A button scrolls back to the latest message when the end is out of view.
 * - A message the person sent shows at once (`pendingMessage`) and the agent thinks under it
 *   (`AIThinking`) until its reply shows something.
 */
export const AIConversation = ({
  approver,
  AssistantMessage = DefaultAssistantMessage,
  bottomInset = 0,
  emptyContent,
  footer,
  isThinking = false,
  loadOlderMessages,
  messages,
  pendingMessage,
  ReplyActions: ReplyActionsProp,
  replyActions,
  UserMessage = DefaultUserMessage,
}: AIConversationProps) => {
  const {
    theme: { conversation },
  } = useTheme();
  const reduceMotion = useReduceMotion();

  const [tracker] = useState(() => new AIPendingMessageTracker());
  const [clock] = useState(() => new AIThinkingClock());

  const entries = useMemo(
    () => tracker.entries(messages, pendingMessage),
    [messages, pendingMessage, tracker],
  );
  // after `entries`, which matched the copies
  const thinking = isThinking || tracker.isAwaitingReply(messages, pendingMessage);
  const turns = useMemo(() => turnsOf(entries), [entries]);
  const latest = turns[turns.length - 1];
  const latestHasReplies = (latest?.entries.length ?? 0) > 1;
  const latestFirstStepId = firstStepOf(latest);
  const latestHasFirstStep = latestFirstStepId !== undefined;
  // Before the views below read it in their effects and next renders: a turn's thinking starts
  // and ends once.
  useLayoutEffect(() => {
    clock.update(latest?.id, thinking, latestHasReplies, latestHasFirstStep);
  }, [clock, latest?.id, latestHasFirstStep, latestHasReplies, thinking]);

  // The rows, keeping each unchanged one's object, so the list renders only the rows that changed.
  const rowCache = useRef(new Map<string, EntryRow>());
  const entryRows = useMemo(() => {
    const cache = new Map<string, EntryRow>();
    const next: EntryRow[] = [];
    turns.forEach((turn) => {
      const firstStepId = firstStepOf(turn);
      turn.entries.forEach((entry, index) => {
        const fields = {
          entry,
          firstStepId,
          kind: 'entry' as const,
          position: (index > 0 ? 'message' : 'turn') as RowPosition,
          turnKey: turn.id,
        };
        const previous = rowCache.current.get(entry.id);
        const row =
          previous && isSameRow(previous, fields) ? previous : { ...fields, key: entry.id };
        cache.set(entry.id, row);
        next.push(row);
      });
    });
    rowCache.current = cache;
    return next;
  }, [turns]);

  const lastTurnKey = latest?.id;
  const tailRow = useMemo<TailRow | undefined>(
    () =>
      lastTurnKey !== undefined && (thinking || footer)
        ? {
            firstStepId: latestFirstStepId,
            footer,
            isThinking: thinking,
            key: TAIL_KEY,
            kind: 'tail',
            turnKey: lastTurnKey,
          }
        : undefined,
    [footer, lastTurnKey, latestFirstStepId, thinking],
  );
  const rows = useMemo<ConversationRow[]>(
    () => (tailRow ? [...entryRows, tailRow] : entryRows),
    [entryRows, tailRow],
  );

  const ReplyActions =
    ReplyActionsProp === undefined ? DefaultConversationReplyActions : ReplyActionsProp;

  const contextValue = useMemo<ConversationContextValue>(
    () => ({ approver, AssistantMessage, clock, ReplyActions, replyActions, UserMessage }),
    [approver, AssistantMessage, clock, ReplyActions, replyActions, UserMessage],
  );

  const listRef = useRef<LegendListRef>(null);
  const anchorIndex = entryRows.findIndex((row) => row.turnKey === lastTurnKey);

  // Whether the end of the latest turn's content is in view: not the room the anchored latest
  // turn leaves under a short reply, nor the room for the floating composer.
  const [isEndInView, setIsEndInView] = useState(true);
  const headerSize = useRef(0);
  const bottomInsetRef = useRef(bottomInset);
  bottomInsetRef.current = bottomInset;
  const checkEnd = useCallback(() => {
    const state = listRef.current?.getState();
    const last = (state?.data.length ?? 0) - 1;
    if (!state || last < 0) return;
    const end = headerSize.current + state.positionAtIndex(last) + state.sizeAtIndex(last);
    const visibleEnd = state.scroll + state.scrollLength - bottomInsetRef.current;
    setIsEndInView(end <= visibleEnd + END_SLACK);
  }, []);
  // Content that grows without a scroll, such as an answer typing out, moves the end too: checked
  // once a frame at most.
  const checkFrame = useRef<number | undefined>(undefined);
  const scheduleCheckEnd = useCallback(() => {
    if (checkFrame.current !== undefined) return;
    checkFrame.current = requestAnimationFrame(() => {
      checkFrame.current = undefined;
      checkEnd();
    });
  }, [checkEnd]);

  // Where to scroll once the latest turn is laid out: a new question pins to the top, and a
  // conversation replaced as a whole opens at its end.
  const pendingScroll = useRef<{ animated: boolean; key: string } | undefined>(undefined);
  const shown = useRef<{ lastTurnKey?: string; mounted: boolean }>({ mounted: false });
  const rowKeys = useMemo(() => new Set(rows.map((row) => row.key)), [rows]);
  useLayoutEffect(() => {
    const previous = shown.current;
    shown.current = { lastTurnKey, mounted: true };
    if (!previous.mounted || lastTurnKey === undefined || lastTurnKey === previous.lastTurnKey) {
      return;
    }
    const continues = previous.lastTurnKey !== undefined && rowKeys.has(previous.lastTurnKey);
    pendingScroll.current = { animated: continues && !reduceMotion, key: lastTurnKey };
  }, [lastTurnKey, reduceMotion, rowKeys]);

  const scrollToPending = useCallback((anchorKey: string | undefined) => {
    const target = pendingScroll.current;
    const list = listRef.current;
    if (!target || !list || anchorKey !== target.key) return;
    pendingScroll.current = undefined;
    void list.scrollToKey({ animated: target.animated, key: target.key, viewPosition: 0 });
  }, []);

  // The least the content can be: the latest question's top plus the list's height, as the native
  // SDKs' latest turn is at least as tall as the conversation. The list leaves that room under the
  // latest turn itself, but only once it has measured what changed, while the content shrinks at
  // once when a row below the question does (a reasoning step folding, the thinking going), and the
  // list grows at once when the keyboard goes, either of which would pull the question down. So the
  // floor is the tallest the list has been at this width, such as without the keyboard.
  const viewport = useRef({ maxLength: 0, width: 0 });
  const [contentFloor, setContentFloor] = useState(0);
  const updateContentFloor = useCallback((anchorKey: string | undefined) => {
    const state = listRef.current?.getState();
    const position = anchorKey === undefined ? undefined : state?.positionByKey(anchorKey);
    if (!state || position === undefined) {
      setContentFloor(0);
      return;
    }
    viewport.current.maxLength = Math.max(viewport.current.maxLength, state.scrollLength);
    setContentFloor(Math.ceil(position + headerSize.current + viewport.current.maxLength));
  }, []);
  const anchorKey = anchorIndex >= 0 ? entryRows[anchorIndex]?.key : undefined;
  const anchorKeyRef = useRef(anchorKey);
  anchorKeyRef.current = anchorKey;
  // The list fills this view, which is there before the list is, such as while the conversation
  // is empty and the keyboard comes up for its first question. A new width, such as on rotation,
  // has heights of its own.
  const onContainerLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      if (layout.width !== viewport.current.width) {
        viewport.current = { maxLength: 0, width: layout.width };
      }
      if (layout.height <= viewport.current.maxLength) return;
      viewport.current.maxLength = layout.height;
      updateContentFloor(anchorKeyRef.current);
    },
    [updateContentFloor],
  );
  // The spinner above the turns coming or going moves the latest question.
  const onMetricsChange = useCallback(
    ({ headerSize: size }: { headerSize: number }) => {
      if (headerSize.current === size) return;
      headerSize.current = size;
      updateContentFloor(anchorKeyRef.current);
    },
    [updateContentFloor],
  );

  const anchoredEndSpace = useMemo<AnchoredEndSpaceConfig | undefined>(
    () =>
      anchorIndex >= 0
        ? {
            anchorIndex,
            onReady: ({ anchorKey }) => {
              updateContentFloor(anchorKey);
              scrollToPending(anchorKey);
              scheduleCheckEnd();
            },
            onSizeChanged: scheduleCheckEnd,
          }
        : undefined,
    [anchorIndex, scheduleCheckEnd, scrollToPending, updateContentFloor],
  );

  // Loads older messages once the spinner above the turns has been in view a moment, and again
  // while it stays in view after a load that failed, or brought nothing while there is more. Only
  // while the list is at rest: on iOS, what arrives above while a finger holds the list, or while
  // it glides or bounces, pushes what is in view down rather than staying out of sight.
  const dragging = useRef(false);
  const gliding = useRef(false);
  const loadsOlder = !!loadOlderMessages && turns.length > 0;
  const loadOlderRef = useRef(loadOlderMessages);
  loadOlderRef.current = loadOlderMessages;
  const loading = useRef(false);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const scheduleLoadOlder = useCallback((delay: number) => {
    clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(async () => {
      const load = loadOlderRef.current;
      if (dragging.current || gliding.current) return;
      if (loading.current || !load || !listRef.current?.getState().isNearStart) return;
      loading.current = true;
      let failed = false;
      try {
        await load();
      } catch {
        failed = true;
      }
      loading.current = false;
      if (mounted.current) scheduleLoadOlder(failed ? LOAD_OLDER_RETRY_MS : LOAD_OLDER_DELAY_MS);
    }, delay);
  }, []);
  const onStartReached = useCallback(
    () => scheduleLoadOlder(LOAD_OLDER_DELAY_MS),
    [scheduleLoadOlder],
  );
  // When the list comes to rest, a load the spinner asked for while it moved goes ahead. A glide
  // that follows the drag starts before the delay is up, and asks again when it ends.
  // A drag that stops a glide ends it, which may not say so itself.
  const onScrollBeginDrag = useCallback(() => {
    dragging.current = true;
    gliding.current = false;
  }, []);
  const onScrollEndDrag = useCallback(() => {
    dragging.current = false;
    scheduleLoadOlder(LOAD_OLDER_DELAY_MS);
  }, [scheduleLoadOlder]);
  const onMomentumScrollBegin = useCallback(() => {
    gliding.current = true;
  }, []);
  const onMomentumScrollEnd = useCallback(() => {
    gliding.current = false;
    scheduleLoadOlder(LOAD_OLDER_DELAY_MS);
  }, [scheduleLoadOlder]);

  useEffect(
    () => () => {
      mounted.current = false;
      clearTimeout(loadTimer.current);
      cancelAnimationFrame(checkFrame.current ?? 0);
    },
    [],
  );

  const scrollToEnd = useCallback(() => {
    void listRef.current?.scrollToEnd({ animated: !reduceMotion });
  }, [reduceMotion]);

  // Flattened: the list reads the floor from it.
  const contentContainerStyle = useMemo(
    () =>
      StyleSheet.flatten([
        { minHeight: contentFloor, paddingBottom: SPACING_MD + bottomInset },
        conversation?.content,
      ]),
    [bottomInset, contentFloor, conversation?.content],
  );

  return (
    <AIToolApproverProvider approver={approver}>
      <ConversationContext.Provider value={contextValue}>
        <View
          onLayout={onContainerLayout}
          style={[styles.container, conversation?.container]}
          testID='ai-conversation'
        >
          {entryRows.length === 0 ? (
            <View
              style={[styles.empty, { paddingBottom: bottomInset }, conversation?.empty]}
              testID='ai-conversation-empty'
            >
              {emptyContent}
            </View>
          ) : (
            <AnimatedLegendList
              anchoredEndSpace={anchoredEndSpace}
              contentContainerStyle={contentContainerStyle}
              data={rows}
              getItemType={typeOf}
              initialScrollAtEnd
              keyExtractor={keyOf}
              keyboardShouldPersistTaps='handled'
              ListHeaderComponent={loadsOlder ? LoadingOlder : null}
              maintainVisibleContentPosition
              onItemSizeChanged={scheduleCheckEnd}
              onMetricsChange={onMetricsChange}
              onMomentumScrollBegin={loadsOlder ? onMomentumScrollBegin : undefined}
              onMomentumScrollEnd={loadsOlder ? onMomentumScrollEnd : undefined}
              onScroll={scheduleCheckEnd}
              onScrollBeginDrag={loadsOlder ? onScrollBeginDrag : undefined}
              onScrollEndDrag={loadsOlder ? onScrollEndDrag : undefined}
              onStartReached={loadsOlder ? onStartReached : undefined}
              onStartReachedThreshold={START_THRESHOLD}
              recycleItems
              ref={listRef}
              renderItem={renderRow}
              testID='ai-conversation-list'
            />
          )}
          {!isEndInView && entryRows.length > 0 ? (
            <View
              pointerEvents='box-none'
              style={[styles.scrollButtonContainer, { bottom: bottomInset + 8 }]}
            >
              <ScrollToLatestButton onPress={scrollToEnd} />
            </View>
          ) : null}
        </View>
      </ConversationContext.Provider>
    </AIToolApproverProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  loadingOlder: { alignItems: 'center', paddingTop: SPACING_MD },
  reply: { gap: 8 },
  row: { paddingHorizontal: SPACING_MD },
  scrollButton: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    height: 40,
    justifyContent: 'center',
    // StreamChatAI's second elevation.
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    width: 40,
  },
  scrollButtonContainer: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
});
