import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { LinkPreviewList } from './components/LinkPreviewList';
import { useHasLinkPreviews } from './hooks/useLinkPreviews';

import { idleRecordingStateSelector } from './utils/audioRecorderSelectors';
import { messageComposerStateStoreSelector } from './utils/messageComposerSelectors';

import { useMessageComposerAPIContext } from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useHasAttachments } from '../../contexts/messageInputContext/hooks/useHasAttachments';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useMessagesContext } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

export const MessageInputHeaderView = () => {
  const {
    theme: {
      messageInput: { contentContainer },
    },
  } = useTheme();
  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { clearEditingState } = useMessageComposerAPIContext();
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);
  const hasLinkPreviews = useHasLinkPreviews();
  const { audioRecorderManager, AttachmentUploadPreviewList } = useMessageInputContext();
  const { Reply } = useMessagesContext();
  const { isRecordingStateIdle } = useStateStore(
    audioRecorderManager.state,
    idleRecordingStateSelector,
  );
  const hasAttachments = useHasAttachments();
  const onDismissReply = useCallback(() => {
    messageComposer.setQuotedMessage(null);
  }, [messageComposer]);

  return isRecordingStateIdle ? (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[
        styles.contentContainer,
        {
          paddingTop:
            hasAttachments || quotedMessage || editing || hasLinkPreviews
              ? primitives.spacingXs
              : 0,
        },
        contentContainer,
      ]}
    >
      {editing ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <Reply
            mode='edit'
            onDismiss={clearEditingState}
            quotedMessage={messageComposer.editedMessage}
          />
        </Animated.View>
      ) : null}
      {quotedMessage ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
          <Reply onDismiss={editing ? undefined : onDismissReply} mode='reply' />
        </Animated.View>
      ) : null}
      <AttachmentUploadPreviewList />
      <LinkPreviewList />
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: primitives.spacingXxs,
    overflow: 'hidden',
    paddingHorizontal: primitives.spacingXs,
  },
});
