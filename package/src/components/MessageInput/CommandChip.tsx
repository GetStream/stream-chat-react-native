import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { textComposerStateSelector } from './utils/messageComposerSelectors';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { GiphyChip } from '../ui/GiphyChip';

export const CommandChip = () => {
  const messageComposer = useMessageComposer();
  const { textComposer, attachmentManager } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  useEffect(() => {
    if (attachmentManager.state.getLatestValue().attachments.length > 0) {
      textComposer.clearCommand();
    }
  }, [textComposer, attachmentManager]);

  return command ? (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      layout={LinearTransition.duration(200)}
      style={styles.giphyContainer}
    >
      <GiphyChip />
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  giphyContainer: {
    padding: primitives.spacingSm,
    alignSelf: 'flex-end',
  },
});
