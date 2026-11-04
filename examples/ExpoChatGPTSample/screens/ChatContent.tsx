import { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderHeight } from 'expo-router/react-navigation';

import type { Attachment, LocalMessage } from 'stream-chat';
import type { MessageProps } from 'stream-chat-expo';
import {
  Channel,
  isLocalUrl,
  MessageList,
  usePaginatedMessageListContext,
  WithComponents,
} from 'stream-chat-expo';

import {
  AIAssistantMessage,
  type AIMessageAttachmentData,
  AIReplyActions,
  AIThinking,
  AIToolApproverProvider,
  AITypingIndicatorView,
  AIUserMessage,
  ComposerView,
  parseMessageParts,
} from 'stream-chat-expo/ai-components';

import { bottomSheetOptions } from '../bottomSheetOptions';
import { VoiceMode } from '../components/VoiceMode';
import { useAppContext } from '../contexts/AppContext';
import { useSendAIMessage } from '../hooks/useSendAIMessage';

// Images and files only: a reply's steps (`ai_*`) are read as its parts, and other kinds, such as
// the router's `connector_authorization`, a second copy of a sign-in its tool call's step asks for,
// aren't shown.
const attachmentOf = (attachment: Attachment): AIMessageAttachmentData | undefined => {
  const name = attachment.title ?? attachment.fallback ?? undefined;
  if (attachment.type === 'image') {
    const url = attachment.image_url ?? attachment.asset_url ?? attachment.thumb_url;
    return url ? { kind: 'image', mimeType: attachment.mime_type, name, url } : undefined;
  }
  if (attachment.type === 'file') {
    const size = Number(attachment.file_size);
    return attachment.asset_url
      ? {
          kind: 'file',
          mimeType: attachment.mime_type,
          name,
          size: Number.isFinite(size) && size > 0 ? size : undefined,
          url: attachment.asset_url,
        }
      : undefined;
  }
  return undefined;
};

const attachmentsOf = (attachments: Attachment[] | undefined) =>
  (attachments ?? [])
    .map(attachmentOf)
    .filter((attachment): attachment is AIMessageAttachmentData => !!attachment);

// The person's message, dimmed while its photos upload.
const UserMessage = ({ message }: { message: LocalMessage }) => {
  const attachments = useMemo(() => attachmentsOf(message.attachments), [message.attachments]);
  const isUploading = useMemo(
    () =>
      (message.attachments ?? []).some(
        (attachment) =>
          (attachment.image_url && isLocalUrl(attachment.image_url)) ||
          (attachment.asset_url && isLocalUrl(attachment.asset_url)),
      ),
    [message.attachments],
  );
  return (
    <View style={[styles.message, { opacity: isUploading ? 0.5 : 1 }]}>
      <AIUserMessage attachments={attachments} text={message.text ?? ''} />
    </View>
  );
};

// A reply: its steps, its answer and what it sent, then its actions once it's written.
const AssistantMessage = ({ message: listed }: { message: LocalMessage }) => {
  // Read so the reply renders again as each live update arrives.
  const { channel, rate, ratings, reasoningText, reasoningVersion } = useAppContext();
  // The list passes a row its message again only when it changes in ways it compares, which a
  // step changing on its own, such as a tool call starting to wait for a sign-in, isn't. The
  // channel's state has every update.
  const message = channel?.state.findMessage(listed.id) ?? listed;
  const parts = useMemo(() => parseMessageParts(message.attachments), [message.attachments]);
  const attachments = useMemo(() => attachmentsOf(message.attachments), [message.attachments]);
  const stepText = useMemo(
    () => (stepId: string) => reasoningText(message.id, stepId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new function per slice of reasoning
    [message.id, reasoningText, reasoningVersion],
  );
  const isGenerating = message.generating === true;
  const text = message.text ?? '';
  // The list sizes a row to its content; a reply takes the row's whole width.
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.message, styles.assistantMessage, { width }]}>
      <AIAssistantMessage
        attachments={attachments}
        isGenerating={isGenerating}
        parts={parts}
        reasoningText={stepText}
        text={text}
      />
      {!isGenerating && text ? (
        <AIReplyActions
          onRate={(rating) => rate(message.id, rating)}
          rating={ratings[message.id] ?? null}
          text={text}
        />
      ) : null}
    </View>
  );
};

const CustomMessage = ({ message }: MessageProps) =>
  message.ai_generated ? <AssistantMessage message={message} /> : <UserMessage message={message} />;

const CustomComposerView = () => {
  const { agentState, stop } = useAppContext();

  // The router stops through its own session, not with an AI indicator event.
  const stopGenerating = useMemo(() => () => Promise.resolve(stop()), [stop]);

  const isGenerating = agentState.kind === 'responding' || agentState.kind === 'working';

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
      isGenerating={isGenerating}
      stopGenerating={stopGenerating}
    />
  );
};

const EmptyStateIndicator = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyContainerText}>What can I help with ?</Text>
  </View>
);

// What the agent is doing while its reply shows nothing yet: thinking, or running skills.
const CustomAITypingIndicatorView = () => {
  const { agentState } = useAppContext();
  const { messages } = usePaginatedMessageListContext();
  const latest = messages[messages.length - 1];
  const replyHasBegun =
    !!latest?.ai_generated && (!!latest.text || parseMessageParts(latest.attachments).length > 0);

  if (agentState.kind === 'working') {
    const skills = agentState.skills.map((skill) => skill.replace(/_/g, ' ')).join(' and ');
    return (
      <View style={styles.aiTypingIndicatorWrapper}>
        <AITypingIndicatorView text={`Working on ${skills}`} />
      </View>
    );
  }
  if (agentState.kind === 'responding' && !replyHasBegun) {
    return (
      <View style={styles.aiTypingIndicatorWrapper}>
        <AIThinking />
      </View>
    );
  }
  return null;
};

const RenderNull = () => null;

const additionalFlatListProps = {
  maintainVisibleContentPosition: {
    minIndexForVisible: 0,
    autoscrollToTopThreshold: 0,
  },
  ListHeaderComponent: undefined,
};

export const ChatContent = () => {
  const { approver, channel, failure } = useAppContext();
  const { bottom } = useSafeAreaInsets();
  // The channel sits below the drawer header, so the keyboard offset has to account for it
  // (without it, Android keeps the composer behind the keyboard).
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return (
      <View style={styles.emptyContainer}>
        {failure ? <Text style={styles.failureText}>{failure}</Text> : <ActivityIndicator />}
      </View>
    );
  }

  return (
    <Animated.View
      key={channel.id}
      style={[styles.wrapper, { paddingBottom: bottom }]}
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
    >
      <WithComponents
        overrides={{
          EmptyStateIndicator,
          Message: CustomMessage,
          NetworkDownIndicator: RenderNull,
        }}
      >
        <AIToolApproverProvider approver={approver}>
          <Channel
            channel={channel}
            keyboardVerticalOffset={headerHeight}
            enableSwipeToReply={false}
          >
            <MessageList additionalFlatListProps={additionalFlatListProps} />
            <CustomAITypingIndicatorView />
            {failure ? <Text style={styles.failureText}>{failure}</Text> : null}
            <VoiceMode />
            <CustomComposerView />
          </Channel>
        </AIToolApproverProvider>
      </WithComponents>
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
  emptyContainerText: { fontSize: 24, fontWeight: 'bold' },
  failureText: { color: '#B00020', fontSize: 15, paddingHorizontal: 24, textAlign: 'center' },
  assistantMessage: { gap: 4 },
  message: { paddingHorizontal: 16, paddingVertical: 8 },
  aiTypingIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
