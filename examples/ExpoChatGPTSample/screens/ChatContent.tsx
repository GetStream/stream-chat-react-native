import { useMemo, useState } from 'react';
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

import type { MessageProps, ResolvedComponents } from 'stream-chat-expo';
import {
  Channel,
  isLocalUrl,
  mergeThemes,
  Message,
  MessageList,
  ThemeProvider,
  useComponentsContext,
  useMessageContext,
  usePaginatedMessageListContext,
  useTheme,
  WithComponents,
} from 'stream-chat-expo';

import {
  AI_MESSAGE_PART_TYPE_PREFIX,
  AIMessageParts,
  AIThinking,
  AIToolApproverProvider,
  AITypingIndicatorView,
  ComposerView,
  parseMessageParts,
  StreamingMessageView,
} from 'stream-chat-expo/ai-components';

import { bottomSheetOptions } from '../bottomSheetOptions';
import { VoiceMode } from '../components/VoiceMode';
import { useAppContext } from '../contexts/AppContext';
import { useSendAIMessage } from '../hooks/useSendAIMessage';

const CustomMessage = (props: MessageProps) => {
  const { theme } = useTheme();
  const { message } = props;
  const isFromBot = message.ai_generated;
  const hasPendingAttachments = useMemo(
    () =>
      (message.attachments ?? []).some(
        (attachment) =>
          (attachment.image_url && isLocalUrl(attachment.image_url)) ||
          (attachment.asset_url && isLocalUrl(attachment.asset_url)),
      ),
    [message.attachments],
  );

  const modifiedTheme = useMemo(
    () =>
      mergeThemes({
        theme,
        style: {
          messageItemView: isFromBot
            ? {
                content: {
                  containerInner: {
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                    borderColor: 'transparent',
                  },
                  textContainer: { maxWidth: '100%' },
                },
              }
            : {
                container: {
                  opacity: hasPendingAttachments ? 0.5 : 1,
                },
              },
        },
      }),
    [theme, isFromBot, hasPendingAttachments],
  );

  return (
    <ThemeProvider mergedStyle={modifiedTheme}>
      <Message {...props} preventPress={true} />
    </ThemeProvider>
  );
};

type UnsupportedAttachmentComponent = ResolvedComponents['UnsupportedAttachment'];

// A reply's steps (`ai_reasoning`, `ai_tool_call`) are attachments the chat SDK doesn't know. They
// show in the reply's own view, so they're left out here, as is the router's `connector_authorization`,
// a second copy of a sign-in its tool call's step already asks for. Any other unknown attachment
// keeps the SDK's own view.
const hidingAISteps = (Fallback: UnsupportedAttachmentComponent) => {
  const HideAISteps: UnsupportedAttachmentComponent = (props) =>
    props.attachment.type?.startsWith(AI_MESSAGE_PART_TYPE_PREFIX) ||
    props.attachment.type === 'connector_authorization' ? null : (
      <Fallback {...props} />
    );
  return HideAISteps;
};

// A reply: its steps (reasoning, tool calls and their questions), then its answer.
const CustomStreamingMessageView = () => {
  const { message: listed } = useMessageContext();
  // Read so the steps render again as each live update arrives.
  const { channel, reasoningText, reasoningVersion } = useAppContext();
  // The list passes a row its message again only when it changes in ways it compares, which a
  // step changing on its own, such as a tool call starting to wait for a sign-in, isn't. The
  // channel's state has every update.
  const message = channel?.state.findMessage(listed.id) ?? listed;
  const parts = useMemo(() => parseMessageParts(message.attachments), [message.attachments]);
  const stepText = useMemo(
    () => (stepId: string) => reasoningText(message.id, stepId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new function per slice of reasoning
    [message.id, reasoningText, reasoningVersion],
  );
  // The message list sizes a bubble to its content; a reply's steps take the row's whole width,
  // the screen less the list's 16 on each side.
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.streamingMessageViewWrapper, { width: width - 32 }]}>
      {parts.length > 0 ? <AIMessageParts parts={parts} reasoningText={stepText} /> : null}
      {message.text ? <StreamingMessageView text={message.text} /> : null}
    </View>
  );
};

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
  // Read above this screen's own overrides, so it is the SDK's view.
  const { UnsupportedAttachment } = useComponentsContext();
  const [CustomUnsupportedAttachment] = useState(() => hidingAISteps(UnsupportedAttachment));

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
          MessageAuthor: RenderNull,
          MessageFooter: RenderNull,
          NetworkDownIndicator: RenderNull,
          StreamingMessageView: CustomStreamingMessageView,
          UnsupportedAttachment: CustomUnsupportedAttachment,
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
  streamingMessageViewWrapper: { paddingHorizontal: 16 },
  aiTypingIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
