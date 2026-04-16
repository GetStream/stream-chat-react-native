import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';

import Animated from 'react-native-reanimated';

import { LinkPreviewList } from './components/LinkPreviewList';
import { useHasLinkPreviews } from './hooks/useLinkPreviews';

import { idleRecordingStateSelector } from './utils/audioRecorderSelectors';
import { messageComposerStateStoreSelector } from './utils/messageComposerSelectors';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useMessageComposerAPIContext } from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useHasAttachments } from '../../contexts/messageInputContext/hooks/useHasAttachments';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { transitions } from '../../utils/transitions';

export const MessageInputHeaderView = () => {
  const {
    theme: {
      messageComposer: { contentContainer },
    },
  } = useTheme();
  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { clearEditingState } = useMessageComposerAPIContext();
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);
  const hasLinkPreviews = useHasLinkPreviews();
  const { audioRecorderManager } = useMessageInputContext();
  const { AttachmentUploadPreviewList, Reply } = useComponentsContext();
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
      layout={transitions.layout200}
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
        <Animated.View entering={transitions.fadeIn200} exiting={transitions.fadeOut200}>
          <Reply
            mode='edit'
            onDismiss={clearEditingState}
            quotedMessage={messageComposer.editedMessage}
          />
        </Animated.View>
      ) : null}
      {quotedMessage && !editing ? (
        <Animated.View entering={transitions.fadeIn200} exiting={transitions.fadeOut200}>
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
