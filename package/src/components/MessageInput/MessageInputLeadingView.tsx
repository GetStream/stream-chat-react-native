import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AttachmentManagerState } from 'stream-chat';

import { textComposerStateSelector } from './utils/messageComposerSelectors';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { GiphyChip } from '../ui/GiphyChip';

const hasAttachmentsSelector = (nextState: AttachmentManagerState) => ({
  hasAttachments: nextState.attachments?.length > 0,
});

export const MessageInputLeadingView = () => {
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  // TODO: V9: This needs to come from the LLC.
  const { hasAttachments } = useStateStore(
    messageComposer.attachmentManager.state,
    hasAttachmentsSelector,
  );
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  useEffect(() => {
    if (hasAttachments) {
      textComposer.clearCommand();
    }
  }, [textComposer, hasAttachments]);

  return command && !hasAttachments ? (
    <View style={styles.giphyContainer}>
      <GiphyChip />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  giphyContainer: {
    padding: primitives.spacingXs,
  },
});
