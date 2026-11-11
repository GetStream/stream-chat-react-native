import React, {
  type ComponentType,
  createContext,
  memo,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

import type { AIConversationEntry } from './entries';
import { AIChatList } from './list/AIChatList';
import type { AIMessage, AIPendingMessage } from './types';
import { type ConversationRow, type RowPosition, useConversationRows } from './useConversationRows';

import { useTheme } from '../contexts';
import type { AIUIHost } from '../generative-ui/AIUIHost';
import { AIUIGenerated, useAIUIHostRefresh } from '../generative-ui/AIUIView';
import { primitives } from '../internal/tokens';
import { AIAssistantMessage } from '../message/AIAssistantMessage';
import type { AIMessageAttachmentData } from '../message/AIMessageAttachment';
import { AIReplyActions, type AIReplyActionsProps } from '../message/AIReplyActions';
import { AIUserMessage } from '../message/AIUserMessage';
import type { AIMessagePartData } from '../message-parts/types';
import { AIThinking } from '../reasoning/AIReasoning';
import { type AIThinkingClock, AIThinkingTurnContext } from '../reasoning/thinkingClock';
import { type AIToolApprover, AIToolApproverProvider } from '../tool-calls/AIToolApprover';

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
  /**
   * Called when the answer starts or stops being typed out. The reply's actions wait until it is
   * done. A view that never calls it has its actions shown once the reply is finished.
   */
  onWritingChange?: (isWriting: boolean) => void;
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
   * How far above the bottom of the screen the composer sits, such as above a tab bar. The
   * keyboard comes up over the conversation, which makes room for it below the latest turn (the
   * room the pinned question leaves takes it first), and covers it only as far as it rises past
   * this. Defaults to the bottom safe area. Needs a `KeyboardProvider` from
   * react-native-keyboard-controller above it.
   */
  keyboardOffset?: number;
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
  /**
   * Shows the UI the agent writes for its replies (`AIMessage.uiDocument`) in place of their
   * text, with the renderers of the formats it writes, such as A2UI. A reply whose UI none of
   * them shows shows its text. Keep one host per conversation, for as long as it shows.
   */
  ui?: AIUIHost;
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
  onWritingChange,
  parts,
  reasoningText,
  text,
}: AIConversationAssistantMessageProps) => (
  <AIAssistantMessage
    approver={approver}
    attachments={attachments}
    id={message.id}
    isGenerating={isGenerating}
    onWritingChange={onWritingChange}
    parts={parts}
    reasoningText={reasoningText}
    text={text}
  />
);

// What every row reads, rather than each row's item carrying it: a row renders again only when
// its item is a new object, or when this changes.
// The tallest each row of the latest turn has been, by row key. The turn never shrinks while it is
// the latest: the room the list leaves under it to keep its question at the top follows a row that
// shrinks (a sign-in going, reasoning folding, the thinking going) only a frame later, and in that
// frame the question would be pulled down. Below a pinned turn there is room anyway, so it looks
// the same, and the room stays the list's, which the keyboard takes before it lifts anything.
type TurnFloor = { heights: Map<string, number>; turnKey: string | undefined };

type ConversationContextValue = {
  AssistantMessage: ComponentType<AIConversationAssistantMessageProps>;
  clock: AIThinkingClock;
  turnFloor: TurnFloor;
  ReplyActions: ComponentType<AIConversationReplyActionsProps> | null;
  UserMessage: ComponentType<AIConversationUserMessageProps>;
  approver?: AIToolApprover;
  replyActions?: AIConversationProps['replyActions'];
  ui?: AIUIHost;
  /** Changes each time the host says what a reply shows changed, so the rows render again. */
  uiVersion: number;
};

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

// StreamChatAI's layout, from the design tokens: turns 8 apart, each with 16 above it, its
// messages 16 apart, and 16 around the whole.
const ROW_GAPS: Record<RowPosition, number> = {
  message: primitives.spacingMd,
  turn: primitives.spacingXs + primitives.spacingMd,
};

type EntryViewProps = {
  AssistantMessage: ComponentType<AIConversationAssistantMessageProps>;
  entry: AIConversationEntry;
  ReplyActions: ComponentType<AIConversationReplyActionsProps> | null;
  UserMessage: ComponentType<AIConversationUserMessageProps>;
  approver?: AIToolApprover;
  ui?: AIUIHost;
};

const REPLY_ACTIONS_IN = FadeIn.duration(200).easing(Easing.out(Easing.ease));

const useReplyWriting = (messageId: string | undefined, isGenerating: boolean) => {
  const [writing, setWriting] = useState<string>();
  const [watched, setWatched] = useState<string>();
  const isWriting = !!messageId && writing === messageId;
  if (messageId && (isGenerating || isWriting) && watched !== messageId) setWatched(messageId);
  const onWritingChange = useMemo(
    () => (value: boolean) =>
      setWriting((current) => (value ? messageId : current === messageId ? undefined : current)),
    [messageId],
  );
  return { isWriting, onWritingChange, wasWatched: !!messageId && watched === messageId };
};

const EntryView = ({
  approver,
  AssistantMessage,
  entry,
  ReplyActions,
  ui,
  UserMessage,
}: EntryViewProps) => {
  const { message, pending } = entry;
  const isReply = message?.role !== 'user';
  const isGenerating = !!message?.isGenerating;
  const { isWriting, onWritingChange, wasWatched } = useReplyWriting(
    isReply ? message?.id : undefined,
    isGenerating,
  );
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
  // The UI the agent generated for the reply, when one of the host's renderers shows it. It
  // shows in place of the reply's text, after the reply's steps.
  const { uiDocument } = message;
  const generated = ui && uiDocument ? ui.content(uiDocument, message.id) : null;
  const showsUI = !!uiDocument && generated !== null && generated !== undefined;
  // A finished reply has its actions under it whether it answers in text or in UI, once the
  // UI is written.
  const hasAnswer = message.text !== '' || showsUI;
  const isWritingUI = showsUI && uiDocument.isStreaming;
  return (
    <View style={styles.reply}>
      <AssistantMessage
        approver={approver}
        attachments={message.attachments ?? []}
        isGenerating={isGenerating}
        message={message}
        onWritingChange={onWritingChange}
        parts={message.parts ?? []}
        reasoningText={message.reasoningText}
        text={showsUI ? '' : message.text}
      />
      {showsUI ? (
        <AIUIGenerated
          isStreaming={uiDocument.isStreaming}
          key={`${message.id}-ui`}
          onError={(error) => ui?.fail(message.id, error)}
        >
          {generated}
        </AIUIGenerated>
      ) : null}
      {ReplyActions && !isGenerating && !isWriting && hasAnswer && !isWritingUI ? (
        <Animated.View entering={wasWatched ? REPLY_ACTIONS_IN : undefined} key={message.id}>
          <ReplyActions isLatestReply={entry.isLatestReply} message={message} text={message.text} />
        </Animated.View>
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
  // A row reused for another starts from that row's floor.
  const turnFloor = context?.turnFloor;
  const isHeld = !!turnFloor && row.turnKey === turnFloor.turnKey;
  const floor = useSharedValue(0);
  useLayoutEffect(() => {
    floor.value = isHeld ? (turnFloor?.heights.get(row.key) ?? 0) : 0;
  }, [floor, isHeld, row.key, turnFloor]);
  const onLayout = isHeld
    ? ({ nativeEvent }: LayoutChangeEvent) => {
        const height = nativeEvent.layout.height;
        if (height <= floor.value) return;
        floor.value = height;
        turnFloor?.heights.set(row.key, height);
      }
    : undefined;
  const floorStyle = useAnimatedStyle(() => ({ minHeight: floor.value }));
  if (!context) return null;
  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.row,
        { paddingTop: row.kind === 'entry' ? ROW_GAPS[row.position] : primitives.spacingMd },
        floorStyle,
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
            ui={context.ui}
            UserMessage={context.UserMessage}
          />
        ) : (
          <>
            {row.isThinking ? <AIThinking /> : null}
            {row.footer}
          </>
        )}
      </AIThinkingTurnContext.Provider>
    </Animated.View>
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
  keyboardOffset,
  loadOlderMessages,
  messages,
  pendingMessage,
  ReplyActions: ReplyActionsProp,
  replyActions,
  ui,
  UserMessage = DefaultUserMessage,
}: AIConversationProps) => {
  // Every reply's UI reaches its renderer before any row asks for its view, oldest first,
  // whether or not the row is on screen. Only what arrived or changed is passed on. The rows
  // show again when the host says what one of them shows changed.
  const uiVersion = useAIUIHostRefresh(ui);
  ui?.receive(messages);
  const canShowUI = useMemo(() => (ui ? ui.canShow.bind(ui) : undefined), [ui]);
  const { anchorKey, clock, rows } = useConversationRows({
    canShowUI,
    footer,
    isThinking,
    messages,
    pendingMessage,
  });

  const ReplyActions =
    ReplyActionsProp === undefined ? DefaultConversationReplyActions : ReplyActionsProp;

  const latestTurnKey = useMemo(
    () => rows.find((row) => row.key === anchorKey)?.turnKey,
    [anchorKey, rows],
  );
  const turnFloor = useMemo<TurnFloor>(
    () => ({ heights: new Map(), turnKey: latestTurnKey }),
    [latestTurnKey],
  );

  const contextValue = useMemo<ConversationContextValue>(
    () => ({
      approver,
      AssistantMessage,
      clock,
      ReplyActions,
      replyActions,
      turnFloor,
      ui,
      uiVersion,
      UserMessage,
    }),
    [
      approver,
      AssistantMessage,
      clock,
      ReplyActions,
      replyActions,
      turnFloor,
      ui,
      uiVersion,
      UserMessage,
    ],
  );

  return (
    <AIToolApproverProvider approver={approver}>
      <ConversationContext.Provider value={contextValue}>
        <AIChatList
          anchorKey={anchorKey}
          bottomInset={bottomInset}
          data={rows}
          emptyContent={emptyContent}
          getItemType={typeOf}
          keyboardOffset={keyboardOffset}
          keyExtractor={keyOf}
          loadOlderMessages={loadOlderMessages}
          renderItem={renderRow}
          testID='ai-conversation'
        />
      </ConversationContext.Provider>
    </AIToolApproverProvider>
  );
};

const styles = StyleSheet.create({
  reply: { gap: 8 },
  row: { paddingHorizontal: primitives.spacingMd },
});
