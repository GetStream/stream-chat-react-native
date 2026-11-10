import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Attachment, LocalMessage } from 'stream-chat';
import { AudioAttachment, AudioPlayerProvider, useStateStore } from 'stream-chat-expo';

import { createA2UIRenderer } from 'stream-chat-expo/a2ui';
import {
  AIAssistantMessage,
  type AIConversationController,
  type AIConversationControllerState,
  AITypingIndicatorView,
  type AIUIAction,
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
import { crewBackend } from '../agent/agents';
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

/** The person's message as the channel has it now, with the voice memos it carries. */
const useStoredMessage = (chat: AgentChat | undefined, messageId: string | undefined) => {
  const { messages } = useStateStore(chat?.state, messagesSelector) ?? { messages: [] };
  const message = useMemo(() => messages.find(({ id }) => id === messageId), [messageId, messages]);
  const notes = useMemo(() => voiceNotesOf(message), [message]);
  return { message, notes };
};

/** The voice memos on a person's message, played with the chat SDK's own voice recording view. */
const VoiceNotes = ({
  message,
  notes,
}: {
  message: LocalMessage;
  notes: ReturnType<typeof voiceNotesOf>;
}) => (
  <View style={styles.voiceNotes}>
    {notes.map((note, index) => (
      <AudioAttachment
        item={{
          ...note,
          id: `${message.id}-${index}`,
          type: note.duration ? 'voiceRecording' : 'audio',
        }}
        key={note.asset_url}
        message={message}
        showTitle={false}
      />
    ))}
  </View>
);

/** What the router heard in a voice memo, folded away until asked for. */
// The spring the agent's reasoning folds with.
const FOLD_SPRING = { damping: 26.5, mass: 1, stiffness: 195 };

const Transcript = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const height = useSharedValue(0);
  const progress = useSharedValue(0);
  const foldStyle = useAnimatedStyle(() => ({
    height: height.value * progress.value,
    opacity: progress.value,
  }));
  const toggle = () => {
    progress.value = withSpring(isOpen ? 0 : 1, FOLD_SPRING);
    setIsOpen(!isOpen);
  };
  return (
    <View style={styles.transcript}>
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ expanded: isOpen }}
        hitSlop={8}
        onPress={toggle}
        testID='voice-memo-transcript-toggle'
      >
        <Text style={styles.transcriptToggle}>
          {isOpen ? 'Hide transcript' : 'Show transcript'}
        </Text>
      </Pressable>
      <Animated.View
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
        style={[styles.transcriptFold, foldStyle]}
      >
        <View
          onLayout={({ nativeEvent }) => {
            height.value = nativeEvent.layout.height;
          }}
          style={styles.transcriptPanel}
        >
          <Text style={styles.transcriptText}>{text}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

/**
 * The person's message as the AI components show it. One sent as a voice memo shows the memo, and
 * the words the router heard in it only when asked for.
 */
const UserMessage = ({ attachments, message, onEdit, text }: AIConversationUserMessageProps) => {
  const { chat } = useAppContext();
  const stored = useStoredMessage(chat, message?.id);
  if (stored.message && stored.notes.length > 0) {
    return (
      <View>
        <VoiceNotes message={stored.message} notes={stored.notes} />
        {text ? <Transcript text={text} /> : null}
        {attachments.length > 0 ? <AIUserMessage attachments={attachments} text='' /> : null}
      </View>
    );
  }
  return text || attachments.length > 0 ? (
    <AIUserMessage attachments={attachments} onEdit={onEdit} text={text} />
  ) : null;
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

/** The event the agent's clock-out form sends when the person saves their reflection. */
const REFLECTION_SAVED = 'reflection_done';

/**
 * Saves a reflection from the agent's clock-out form with the backend, and gives back the action
 * to send the agent, which says it is saved.
 */
const saveReflection = async (action: AIUIAction): Promise<AIUIAction> => {
  const context = (action.payload.context ?? {}) as Record<string, unknown>;
  const challenges = Array.isArray(context.challenges) ? context.challenges : [];
  await crewBackend('crew/reflections', {
    body: {
      energy: Math.round(Number(context.energy)),
      themes: challenges
        .filter((challenge): challenge is string => typeof challenge === 'string')
        .map((challenge) => challenge.replace(/_/g, ' ')),
      win: typeof context.win === 'string' ? context.win.trim() : '',
    },
  });
  return { ...action, payload: { ...action.payload, context: { ...context, saved: true } } };
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
        send: async (action) => {
          if (isAIConversationAnswering(conversation.state.getLatestValue().status)) {
            throw new Error('Crew is still answering');
          }
          let sent = action;
          if (action.name === REFLECTION_SAVED) {
            try {
              sent = await saveReflection(action);
            } catch (error) {
              Alert.alert(
                "Your reflection wasn't saved",
                error instanceof Error ? error.message : String(error),
              );
              throw error;
            }
          }
          const custom: AgentRequestCustom = { uiAction: aiUIActionJSON(sent) };
          conversation.send({ custom, text: sent.label });
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
  transcript: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 6 },
  transcriptFold: { alignSelf: 'stretch', overflow: 'hidden' },
  transcriptPanel: { alignItems: 'flex-end', paddingTop: 4, position: 'absolute', width: '100%' },
  transcriptText: { color: '#5C6370', fontSize: 14, lineHeight: 20 },
  transcriptToggle: { color: '#C8102E', fontSize: 13, fontWeight: '600' },
  voiceNotes: { alignItems: 'flex-end', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
  wrapper: { backgroundColor: '#FCFCFC', flex: 1 },
});
