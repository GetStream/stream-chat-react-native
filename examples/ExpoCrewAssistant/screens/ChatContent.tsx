import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Attachment, LocalMessage } from 'stream-chat';
import { AudioAttachment, AudioPlayerProvider, useStateStore } from 'stream-chat-expo';

import { createA2UIRenderer } from 'stream-chat-expo/a2ui';
import {
  AIAssistantMessage,
  type AIConversationController,
  type AIConversationControllerState,
  AITypingIndicatorView,
  aiUIActionJSON,
  AIUIHost,
  AIUserMessage,
  ComposerView,
  isAIConversationAnswering,
  useAIConversationState,
} from 'stream-chat-expo/ai-components';
import {
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIConversationUserMessageProps,
} from 'stream-chat-expo/ai-components/conversation';

import { AgentNotices } from './AgentNotices';
import { VoiceMemoBar, VoiceMemoButton } from './VoiceMemo';

import type { AgentChat, AgentChatState } from '../agent/agentChat';
import type { AgentRequestCustom } from '../agent/agentTransport';
import { VoiceMode } from '../components/VoiceMode';
import { useAppContext } from '../contexts/AppContext';
import { type Flow, FLOWS } from '../flows';

const errorSelector = ({ error }: AIConversationControllerState) => ({ error });

/**
 * The composer, with what rides the keyboard above it: the questions of calls that ask first, and
 * why something failed, with a way to try again. And voice mode beside it.
 */
const ComposerArea = ({
  chat,
  conversation,
  failure,
}: {
  chat: AgentChat;
  conversation: AIConversationController;
  failure: string | undefined;
}) => {
  const { error } = useAIConversationState(conversation, errorSelector);

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

  return (
    <ComposerView
      bottomSheetInsets={insets}
      conversation={conversation}
      header={
        <>
          <AgentNotices chat={chat} />
          <VoiceMemoBar />
          {failure ? <Text style={styles.failureText}>{failure}</Text> : null}
          {error ? (
            <Pressable accessibilityRole='button' onPress={() => conversation.retry()}>
              <Text style={styles.failureText}>{error.message}</Text>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          ) : null}
        </>
      }
      trailing={
        <View style={styles.trailing}>
          <VoiceMemoButton />
          <VoiceMode />
        </View>
      }
    />
  );
};

const pendingSelector = ({ pendingMessage }: AIConversationControllerState) => ({
  pendingMessage,
});

/** What the assistant helps with, for an empty conversation: each starts a new one. */
const Flows = ({ conversation }: { conversation: AIConversationController }) => {
  const { startConversationAbout } = useAppContext();
  const { pendingMessage } = useAIConversationState(conversation, pendingSelector);
  if (pendingMessage) return null;
  const start = (flow: Flow) =>
    'event' in flow ? startConversationAbout(flow.event) : conversation.send({ text: flow.ask });
  return (
    <ScrollView contentContainerStyle={styles.flows}>
      <Text style={styles.hello}>Hi Jordan 👋</Text>
      <Text style={styles.helloSub}>What do you need before, during or after your shift?</Text>
      <View style={styles.grid}>
        {FLOWS.map((flow) => (
          <Pressable
            accessibilityRole='button'
            key={flow.id}
            onPress={() => start(flow)}
            style={({ pressed }) => [styles.flow, pressed && styles.pressed]}
            testID={`flow-${flow.id}`}
          >
            <Text style={styles.flowEmoji}>{flow.emoji}</Text>
            <Text style={styles.flowTitle}>{flow.title}</Text>
            <Text style={styles.flowSubtitle}>{flow.subtitle}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

const emptySelector = ({ awaitingAgent, isLoaded }: AgentChatState) => ({
  awaitingAgent,
  isLoaded,
});

const EmptyContent = ({
  chat,
  conversation,
}: {
  chat: AgentChat;
  conversation: AIConversationController;
}) => {
  const { awaitingAgent, isLoaded } = useStateStore(chat.state, emptySelector);
  if (awaitingAgent) {
    return <AITypingIndicatorView text='Crew is getting things ready' />;
  }
  return isLoaded ? <Flows conversation={conversation} /> : <ActivityIndicator />;
};

type Source = { id: string; title: string; url: string; citation?: string };

const sourcesOf = (message: LocalMessage | undefined): Source[] => {
  const support = (message as { support_message?: { sources?: Source[] } } | undefined)
    ?.support_message;
  return support?.sources ?? [];
};

const messagesSelector = ({ messages }: AgentChatState) => ({ messages });

/** The handbook passages and pages a reply was answered from, under it. */
const ReplySources = ({ chat, messageId }: { chat: AgentChat; messageId: string }) => {
  const { messages } = useStateStore(chat.state, messagesSelector);
  const message = useMemo(() => messages.find(({ id }) => id === messageId), [messageId, messages]);
  const sources = useMemo(() => sourcesOf(message), [message]);
  if (sources.length === 0) return null;
  return (
    <View style={styles.sources} testID='reply-sources'>
      <Text style={styles.sourcesTitle}>Sources</Text>
      {sources.map((source, index) => (
        <Pressable
          accessibilityRole='link'
          key={source.id}
          onPress={() => void Linking.openURL(source.url)}
          style={styles.source}
        >
          <Text style={styles.sourceIndex}>{index + 1}</Text>
          <View style={styles.sourceBody}>
            <Text style={styles.sourceTitle}>{source.title}</Text>
            {source.citation ? (
              <Text numberOfLines={2} style={styles.sourceCitation}>
                {source.citation}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
};

// One player pool for the conversation, as a channel has: starting one memo pauses another.
const AUDIO_PLAYER = { allowConcurrentAudioPlayback: false };

const voiceNotesOf = (message: LocalMessage | undefined) =>
  (message?.attachments ?? []).filter(
    (attachment): attachment is Attachment & { asset_url: string } =>
      attachment.type === 'voiceRecording' && !!attachment.asset_url,
  );

/** The voice memos on a person's message, played with the chat SDK's own voice recording view. */
const VoiceNotes = ({ chat, messageId }: { chat: AgentChat; messageId: string }) => {
  const { messages } = useStateStore(chat.state, messagesSelector);
  const message = useMemo(() => messages.find(({ id }) => id === messageId), [messageId, messages]);
  const notes = useMemo(() => voiceNotesOf(message), [message]);
  if (notes.length === 0) return null;
  return (
    <View style={styles.voiceNotes}>
      {notes.map((note, index) => (
        <AudioAttachment
          item={{ ...note, id: `${messageId}-${index}`, type: 'voiceRecording' }}
          key={note.asset_url}
          message={message}
          showTitle={false}
        />
      ))}
    </View>
  );
};

/** The person's message as the AI components show it, after the voice memo it carries, if any. */
const UserMessage = ({ attachments, message, onEdit, text }: AIConversationUserMessageProps) => {
  const { chat } = useAppContext();
  return (
    <View>
      {chat && message ? <VoiceNotes chat={chat} messageId={message.id} /> : null}
      {text || attachments.length > 0 ? (
        <AIUserMessage attachments={attachments} onEdit={onEdit} text={text} />
      ) : null}
    </View>
  );
};

/** The agent's reply as the AI components show it, then the sources it was answered from. */
const AssistantMessage = ({
  approver,
  attachments,
  isGenerating,
  message,
  onWritingChange,
  parts,
  reasoningText,
  text,
}: AIConversationAssistantMessageProps) => {
  const { chat } = useAppContext();
  return (
    <View>
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
      {chat && !isGenerating ? <ReplySources chat={chat} messageId={message.id} /> : null}
    </View>
  );
};

/** The open conversation, as its controller has it. */
const Conversation = ({
  chat,
  conversation,
}: {
  chat: AgentChat;
  conversation: AIConversationController;
}) => {
  const { agentState } = useAppContext();

  // The UI the agent writes for its replies, in A2UI: checklists, quizzes and forms. One host per
  // conversation, so what a reply's UI holds survives scrolling. What the person does in it goes
  // to the agent as their next message.
  const [ui] = useState(
    () =>
      new AIUIHost({
        renderers: [createA2UIRenderer()],
        send: (action) => {
          if (isAIConversationAnswering(conversation.state.getLatestValue().status)) {
            throw new Error('Crew is still answering');
          }
          const custom: AgentRequestCustom = { uiAction: aiUIActionJSON(action) };
          conversation.send({ custom, text: action.label });
        },
      }),
  );

  const footer =
    agentState.kind === 'working' ? (
      <AITypingIndicatorView
        text={`Working on ${agentState.skills.map((skill) => skill.replace(/_/g, ' ')).join(' and ')}`}
      />
    ) : undefined;

  return (
    <AudioPlayerProvider value={AUDIO_PLAYER}>
      <AIConversation
        AssistantMessage={AssistantMessage}
        conversation={conversation}
        emptyContent={<EmptyContent chat={chat} conversation={conversation} />}
        footer={footer}
        ui={ui}
        UserMessage={UserMessage}
      />
    </AudioPlayerProvider>
  );
};

export const ChatContent = () => {
  const { chat, conversation, failure } = useAppContext();
  const { bottom } = useSafeAreaInsets();

  if (!chat || !conversation) {
    return (
      <View style={styles.emptyContainer}>
        {failure ? <Text style={styles.failureText}>{failure}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  return (
    <Animated.View
      key={chat.key}
      style={[styles.wrapper, { paddingBottom: bottom }]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <Conversation chat={chat} conversation={conversation} />
      <ComposerArea chat={chat} conversation={conversation} failure={failure} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  failureText: { color: '#B00020', fontSize: 15, paddingHorizontal: 24, textAlign: 'center' },
  flow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6E8EC',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 14,
    width: '48%',
  },
  flowEmoji: { fontSize: 24 },
  flowSubtitle: { color: '#5C6370', fontSize: 13 },
  flowTitle: { color: '#0B1220', fontSize: 15, fontWeight: '700' },
  flows: { paddingHorizontal: 16, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  hello: { color: '#0B1220', fontSize: 26, fontWeight: '800' },
  helloSub: { color: '#5C6370', fontSize: 15, marginBottom: 20, marginTop: 4 },
  pressed: { opacity: 0.6 },
  retryText: {
    color: '#C8102E',
    fontSize: 15,
    fontWeight: '600',
    paddingTop: 4,
    textAlign: 'center',
  },
  source: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  sourceBody: { flex: 1 },
  sourceCitation: { color: '#5C6370', fontSize: 13 },
  sourceIndex: {
    backgroundColor: '#FDECEE',
    borderRadius: 10,
    color: '#C8102E',
    fontSize: 12,
    fontWeight: '700',
    height: 20,
    lineHeight: 20,
    textAlign: 'center',
    width: 20,
  },
  sourceTitle: { color: '#0B1220', fontSize: 14, fontWeight: '600' },
  sources: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
  },
  sourcesTitle: { color: '#5C6370', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  trailing: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  voiceNotes: { alignItems: 'flex-end', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
  wrapper: { backgroundColor: '#FCFCFC', flex: 1 },
});
