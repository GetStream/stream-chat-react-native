import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderHeight } from 'expo-router/react-navigation';

import type { MessageProps, ResolvedComponents } from 'stream-chat-expo';
import {
  AIStates,
  Channel,
  isLocalUrl,
  mergeThemes,
  Message,
  MessageList,
  ThemeProvider,
  useAIState,
  useChannelContext,
  useComponentsContext,
  useMessageContext,
  useTheme,
  WithComponents,
} from 'stream-chat-expo';

import {
  AI_MESSAGE_PART_TYPE_PREFIX,
  AITypingIndicatorView,
  ComposerView,
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
// get their own views; until then they're left out rather than shown as unsupported files, and any
// other unknown attachment keeps the SDK's own view.
const hidingAISteps = (Fallback: UnsupportedAttachmentComponent) => {
  const HideAISteps: UnsupportedAttachmentComponent = (props) =>
    props.attachment.type?.startsWith(AI_MESSAGE_PART_TYPE_PREFIX) ? null : <Fallback {...props} />;
  return HideAISteps;
};

const CustomStreamingMessageView = () => {
  const { message } = useMessageContext();
  return (
    <View style={styles.streamingMessageViewWrapper}>
      <StreamingMessageView text={message.text ?? ''} />
    </View>
  );
};

const CustomComposerView = () => {
  const { channel } = useChannelContext();
  const { stop } = useAppContext();

  const { aiState } = useAIState(channel);

  // The router stops through its own session, not with an AI indicator event.
  const stopGenerating = useMemo(() => () => Promise.resolve(stop()), [stop]);

  const isGenerating = [AIStates.Thinking, AIStates.Generating].includes(aiState);

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

const CustomAITypingIndicatorView = () => {
  const { channel } = useChannelContext();
  const { aiState } = useAIState(channel);

  const allowedStates = {
    [AIStates.Thinking]: 'Thinking about the question...',
    [AIStates.Generating]: 'Generating a response...',
    [AIStates.ExternalSources]: 'Checking external sources...',
  };

  const indicatorText = allowedStates[aiState as keyof typeof allowedStates];

  if (!indicatorText) {
    return null;
  }

  return (
    <View style={styles.aiTypingIndicatorWrapper}>
      <AITypingIndicatorView text={indicatorText} />
    </View>
  );
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
  const { channel, failure } = useAppContext();
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
        <Channel channel={channel} keyboardVerticalOffset={headerHeight} enableSwipeToReply={false}>
          <MessageList additionalFlatListProps={additionalFlatListProps} />
          <CustomAITypingIndicatorView />
          {failure ? <Text style={styles.failureText}>{failure}</Text> : null}
          <VoiceMode />
          <CustomComposerView />
        </Channel>
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
  streamingMessageViewWrapper: { width: '100%', paddingHorizontal: 16 },
  aiTypingIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
