import React from 'react';
import { StyleSheet, View } from 'react-native';

import { textComposerStateSelector } from './utils/messageComposerSelectors';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { GiphyChip } from '../ui/GiphyChip';

export const MessageInputLeadingView = () => {
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);

  return command ? (
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
