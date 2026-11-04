import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStateStore } from 'stream-chat-expo';

import {
  AIConversation,
  type AIMessage,
  AISuggestions,
  AITypingIndicatorView,
  ComposerView,
  createFromStreamMessage,
  createNewComposerStore,
} from 'stream-chat-expo/ai-components';

import type { AgentChat, AgentChatState } from '../agent/agentChat';
import { chatOptions, STARTERS, THINK_HARDER } from '../chatOptions';
import { VoiceMode } from '../components/VoiceMode';
import { useAppContext } from '../contexts/AppContext';
import { useSendAIMessage } from '../hooks/useSendAIMessage';

type Composer = ReturnType<typeof createNewComposerStore>;

const CustomComposerView = ({ composer, header }: { composer: Composer; header: ReactNode }) => {
  const { isBusy, stop } = useAppContext();

  // The router stops through its own session, not with an AI indicator event.
  const stopGenerating = useMemo(() => () => Promise.resolve(stop()), [stop]);

  const safeAreaInsets = useSafeAreaInsets();
  const insets = useMemo(
    () => ({
      ...safeAreaInsets,
      bottom:
        safeAreaInsets.bottom +
        (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) * 2 : 0),
    }),
    [safeAreaInsets],
  );

  const serializeToMessage = useSendAIMessage();

  return (
    <ComposerView
      chatOptions={chatOptions}
      header={header}
      state={composer}
      bottomSheetInsets={insets}
      onSendMessage={serializeToMessage}
      isGenerating={isBusy}
      stopGenerating={stopGenerating}
    />
  );
};

const EmptyState = () => <Text style={styles.emptyText}>What can I help with ?</Text>;

const isEmptySelector = ({ messages }: AgentChatState) => ({ isEmpty: messages.length === 0 });

/**
 * Starters, above the composer, until the conversation has a first question. One is asked with the
 * option picked in the composer, as the composer would ask it.
 */
const Starters = ({ chat, composer }: { chat: AgentChat; composer: Composer }) => {
  const { ask, pending } = useAppContext();
  const { isEmpty } = useStateStore(chat.state, isEmptySelector);
  if (!isEmpty || pending) return null;
  const onSelect = (text: string) => {
    const { chatOption } = composer.getLatestValue();
    void ask(text, [], chatOption?.id === THINK_HARDER.id);
  };
  return <AISuggestions onSelect={onSelect} suggestions={STARTERS} />;
};

/**
 * The composer, with what rides the keyboard above it: a failure, the way into voice mode and the
 * starters, which share the composer's draft and picked option.
 */
const ComposerArea = ({ chat, failure }: { chat: AgentChat; failure: string | undefined }) => {
  const [composer] = useState(createNewComposerStore);
  return (
    <CustomComposerView
      composer={composer}
      header={
        <>
          {failure ? <Text style={styles.failureText}>{failure}</Text> : null}
          <VoiceMode />
          <Starters chat={chat} composer={composer} />
        </>
      }
    />
  );
};

const conversationSelector = ({ hasOlderMessages, messages }: AgentChatState) => ({
  hasOlderMessages,
  messages,
});

/** The open conversation, read from its channel by `AgentChat`. */
const Conversation = ({ chat }: { chat: AgentChat }) => {
  const { agentState, approver, isThinking, pending, rate, ratings } = useAppContext();
  const { hasOlderMessages, messages } = useStateStore(chat.state, conversationSelector);

  // The same message object for each Stream message that didn't change, so only the messages an
  // update touched render again. The live thinking is read through `chat.reasoning`.
  const [fromStreamMessage] = useState(() =>
    createFromStreamMessage({
      reasoningText: (messageId, stepId) => chat.reasoning.get(messageId, stepId),
    }),
  );
  const conversation = useMemo(
    () => messages.map(fromStreamMessage),
    [fromStreamMessage, messages],
  );

  const replyActions = useCallback(
    (message: AIMessage) => ({
      onRate: (rating: Parameters<typeof rate>[1]) => rate(message.id, rating),
      rating: ratings[message.id] ?? null,
    }),
    [rate, ratings],
  );

  // What the agent is doing while it runs skills, under the latest turn.
  const footer =
    agentState.kind === 'working' ? (
      <AITypingIndicatorView
        text={`Working on ${agentState.skills.map((skill) => skill.replace(/_/g, ' ')).join(' and ')}`}
      />
    ) : undefined;

  return (
    <AIConversation
      approver={approver}
      emptyContent={<EmptyState />}
      footer={footer}
      isThinking={isThinking}
      loadOlderMessages={hasOlderMessages ? chat.loadOlderMessages : undefined}
      messages={conversation}
      pendingMessage={pending}
      replyActions={replyActions}
    />
  );
};

export const ChatContent = () => {
  const { chat, failure } = useAppContext();
  const { bottom } = useSafeAreaInsets();

  if (!chat) {
    return (
      <View style={styles.emptyContainer}>
        {failure ? <Text style={styles.failureText}>{failure}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  return (
    <Animated.View
      key={chat.session.id}
      style={[styles.wrapper, { paddingBottom: bottom }]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      {/* The keyboard is the SDK's: the conversation makes room for it, the composer rides it. */}
      <Conversation chat={chat} />
      <ComposerArea chat={chat} failure={failure} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fcfcfc' },
  emptyContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { fontSize: 24, fontWeight: 'bold' },
  failureText: { color: '#B00020', fontSize: 15, paddingHorizontal: 24, textAlign: 'center' },
});
