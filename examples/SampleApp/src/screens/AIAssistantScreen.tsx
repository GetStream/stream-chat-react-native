import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import type { Channel as StreamChatChannel } from 'stream-chat';
import {
  AIStates,
  Channel,
  MessageList,
  useAIState,
  useChannelContext,
  useMessageComposer,
  useMessageContext,
  useMessageInputContext,
  useStableCallback,
  WithComponents,
} from 'stream-chat-react-native';
import {
  AITypingIndicatorView,
  ComposerView,
  type ComposerViewProps,
  StreamingMessageView,
  StreamTheme,
} from 'stream-chat-react-native/ai-components';

import { ScreenHeader } from '../components/ScreenHeader';
import { useAppContext } from '../context/AppContext';

/**
 * A ChatGPT-style screen built from `stream-chat-react-native/ai-components`.
 *
 * Replies come from an AI agent connected to the channel on your backend (see the Stream AI
 * integration docs). Without one, "Showcase" posts an `ai_generated` message that exercises the
 * markdown renderer: syntax highlighting, tables and charts.
 */

const SHOWCASE_MESSAGE = [
  '## What the AI components render',
  '',
  'Messages from the assistant are **streamed** as *markdown*, including [links](https://getstream.io), lists and code:',
  '',
  '1. Syntax highlighted code blocks, with a copy button',
  '2. Tables that scroll horizontally',
  '3. Charts from `mermaid` and Vega-Lite `json` blocks',
  '',
  '```typescript',
  "import { StreamingMessageView } from 'stream-chat-react-native/ai-components';",
  '',
  'export const AIMessage = ({ text }: { text: string }) => (',
  '  <StreamingMessageView letterInterval={10} text={text} />',
  ');',
  '```',
  '',
  '| Model | Context window | Streaming |',
  '| --- | --- | --- |',
  '| Small | 32k | Yes |',
  '| Large | 200k | Yes |',
  '',
  '```mermaid',
  'pie',
  'title Pets adopted by volunteers',
  '"Dogs" : 386',
  '"Cats" : 85',
  '"Rats" : 15',
  '```',
  '',
  '```json',
  JSON.stringify({
    data: {
      values: [
        { a: 'Mon', b: 28 },
        { a: 'Tue', b: 55 },
        { a: 'Wed', b: 43 },
        { a: 'Thu', b: 91 },
        { a: 'Fri', b: 81 },
      ],
    },
    encoding: {
      x: { field: 'a', type: 'nominal' },
      y: { field: 'b', type: 'quantitative' },
    },
    mark: 'bar',
  }),
  '```',
].join('\n');

const AIStreamingMessageView = () => {
  const { message } = useMessageContext();
  return (
    <View style={styles.streamingMessageViewWrapper}>
      <StreamingMessageView text={message.text ?? ''} />
    </View>
  );
};

const AITypingIndicator = () => {
  const { channel } = useChannelContext();
  const { aiState } = useAIState(channel);

  const indicatorText = {
    [AIStates.Thinking]: 'Thinking about the question...',
    [AIStates.Generating]: 'Generating a response...',
    [AIStates.ExternalSources]: 'Checking external sources...',
  }[aiState as string];

  if (!indicatorText) {
    return null;
  }

  return (
    <View style={styles.aiTypingIndicatorWrapper}>
      <AITypingIndicatorView text={indicatorText} />
    </View>
  );
};

const AIComposer = () => {
  const messageComposer = useMessageComposer();
  const { sendMessage } = useMessageInputContext();
  const { channel } = useChannelContext();
  const { aiState } = useAIState(channel);
  const insets = useSafeAreaInsets();

  const isGenerating = aiState === AIStates.Thinking || aiState === AIStates.Generating;
  const stopGenerating = useCallback(async () => {
    await channel?.stopAIResponse();
  }, [channel]);

  const onSendMessage = useStableCallback<
    Parameters<ComposerViewProps['onSendMessage']>,
    Promise<void>
  >(async ({ attachments, text }) => {
    messageComposer.textComposer.setText(text);
    if (attachments?.length) {
      const localAttachments = await Promise.all(
        attachments.map((asset) =>
          messageComposer.attachmentManager.fileToLocalUploadAttachment({
            name: asset.name ?? asset.uri.split('/').pop() ?? 'image',
            size: asset.size ?? 0,
            type: asset.type ?? 'image/jpeg',
            uri: asset.uri,
          }),
        ),
      );
      messageComposer.attachmentManager.upsertAttachments(localAttachments);
    }
    await sendMessage();
  });

  return (
    <ComposerView
      bottomSheetInsets={insets}
      isGenerating={isGenerating}
      onSendMessage={onSendMessage}
      stopGenerating={stopGenerating}
    />
  );
};

const EmptyStateIndicator = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyContainerText}>What can I help with?</Text>
  </View>
);

const RenderNull = () => null;

// `WithComponents` reads its overrides once, so they must be stable.
const aiComponentOverrides = {
  EmptyStateIndicator,
  MessageFooter: RenderNull,
  StreamingMessageView: AIStreamingMessageView,
};

export const AIAssistantScreen = () => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation();
  const [channel, setChannel] = useState<StreamChatChannel>();

  useEffect(() => {
    const userId = chatClient?.userID;
    if (!chatClient || !userId) {
      return;
    }

    const assistantChannel = chatClient.channel(
      'messaging',
      `ai-assistant-${userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      { members: [userId], name: 'AI Assistant' },
    );
    assistantChannel
      .watch()
      .then(() => setChannel(assistantChannel))
      .catch((error) => console.log('Could not load the AI assistant channel', error));
  }, [chatClient]);

  const sendShowcase = useCallback(async () => {
    await channel?.sendMessage({ ai_generated: true, text: SHOWCASE_MESSAGE });
  }, [channel]);

  const header = (
    <ScreenHeader
      onBack={navigation.goBack}
      // eslint-disable-next-line react/no-unstable-nested-components -- same pattern as ChannelScreen's header
      RightContent={() => (
        <Pressable
          accessibilityRole='button'
          disabled={!channel}
          onPress={sendShowcase}
          style={({ pressed }) => [styles.showcaseButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.showcaseButtonText}>Showcase</Text>
        </Pressable>
      )}
      titleText='AI Assistant'
    />
  );

  if (!channel) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.flex}>
        {header}
      </SafeAreaView>
    );
  }

  // As in ChannelScreen, the header is rendered inside `Channel`, whose keyboard avoiding container
  // takes the full height of the screen.
  // Unlike the SDK's MessageComposer, the AI ComposerView leaves the bottom inset to the app.
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.flex}>
      <StreamTheme>
        <WithComponents overrides={aiComponentOverrides}>
          <Channel channel={channel} enableSwipeToReply={false} keyboardVerticalOffset={0}>
            {header}
            <MessageList />
            <AITypingIndicator />
            <AIComposer />
          </Channel>
        </WithComponents>
      </StreamTheme>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  aiTypingIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  emptyContainerText: { fontSize: 24, fontWeight: 'bold' },
  flex: { flex: 1 },
  showcaseButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  showcaseButtonText: { fontSize: 14, fontWeight: '600' },
  streamingMessageViewWrapper: { paddingHorizontal: 16, width: '100%' },
});
