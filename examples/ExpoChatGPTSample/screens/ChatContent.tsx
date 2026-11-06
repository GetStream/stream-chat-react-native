import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderHeight } from 'expo-router/react-navigation';

import { KeyboardCompatibleView, useStateStore } from 'stream-chat-expo';

import {
  AIConversation,
  type AIMessage,
  AITypingIndicatorView,
  ComposerView,
  createFromStreamMessage,
} from 'stream-chat-expo/ai-components';

import type { AgentChat, AgentChatState } from '../agent/agentChat';
import { bottomSheetOptions } from '../bottomSheetOptions';
import { VoiceMode } from '../components/VoiceMode';
import { useAppContext } from '../contexts/AppContext';
import { useSendAIMessage } from '../hooks/useSendAIMessage';

const CustomComposerView = () => {
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
      bottomSheetOptions={bottomSheetOptions}
      bottomSheetInsets={insets}
      onSendMessage={serializeToMessage}
      isGenerating={isBusy}
      stopGenerating={stopGenerating}
    />
  );
};

const EmptyState = () => <Text style={styles.emptyText}>What can I help with ?</Text>;

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
  // The conversation sits below the drawer header, so the keyboard offset has to account for it.
  const headerHeight = useHeaderHeight();

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
      <KeyboardCompatibleView keyboardVerticalOffset={headerHeight} style={styles.flex}>
        <Conversation chat={chat} />
        {failure ? <Text style={styles.failureText}>{failure}</Text> : null}
        <VoiceMode />
        <CustomComposerView />
      </KeyboardCompatibleView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fcfcfc' },
  flex: { flex: 1 },
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
