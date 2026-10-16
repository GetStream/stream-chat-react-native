import { useCallback, useMemo } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderHeight } from 'expo-router/react-navigation';

import type { MessageProps } from 'stream-chat-expo';
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
  useMessageComposer,
  useMessageContext,
  useMessageInputContext,
  useStableCallback,
  useTheme,
  WithComponents,
} from 'stream-chat-expo';

import {
  AITypingIndicatorView,
  ComposerView,
  type ComposerViewProps,
  StreamingMessageView,
} from 'stream-chat-expo/ai-components';

import { bottomSheetOptions } from '../bottomSheetOptions';
import { useAppContext } from '../contexts/AppContext';

const CustomMessage = (props: MessageProps) => {
  const { theme } = useTheme();
  const { message } = props;
  const isFromBot = message.custom?.ai_generated;
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

const CustomStreamingMessageView = () => {
  const { message } = useMessageContext();
  return (
    <View style={styles.streamingMessageViewWrapper}>
      <StreamingMessageView text={message.text ?? ''} />
    </View>
  );
};

const CustomComposerView = () => {
  const messageComposer = useMessageComposer();
  const { sendMessage } = useMessageInputContext();
  const { channel } = useChannelContext();

  const { aiState } = useAIState(channel);

  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);

  const isGenerating = aiState === AIStates.Thinking || aiState === AIStates.Generating;

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

  const serializeToMessage = useStableCallback(
    async ({ text, attachments }: Parameters<ComposerViewProps['onSendMessage']>[0]) => {
      messageComposer.textComposer.setText(text);
      if (attachments && attachments.length > 0) {
        const localAttachments = await Promise.all(
          attachments.map((asset) =>
            messageComposer.attachmentManager.fileToLocalUploadAttachment({
              ...asset,
              // The picker can leave these out (e.g. some iOS photos have no file name).
              name: asset.name ?? asset.uri.split('/').pop() ?? 'image',
              size: asset.size ?? 0,
              type: asset.type ?? 'image/jpeg',
            }),
          ),
        );
        messageComposer.attachmentManager.upsertAttachments(localAttachments);
      }

      await sendMessage();
    },
  );

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
  const { channel } = useAppContext();
  const { bottom } = useSafeAreaInsets();
  // The channel sits below the drawer header, so the keyboard offset has to account for it
  // (without it, Android keeps the composer behind the keyboard).
  const headerHeight = useHeaderHeight();

  if (!channel) {
    return null;
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
        }}
      >
        <Channel
          channel={channel}
          initializeOnMount={false}
          keyboardVerticalOffset={headerHeight}
          enableSwipeToReply={false}
        >
          <MessageList additionalFlatListProps={additionalFlatListProps} />
          <CustomAITypingIndicatorView />
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
  streamingMessageViewWrapper: { width: '100%', paddingHorizontal: 16 },
  aiTypingIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
