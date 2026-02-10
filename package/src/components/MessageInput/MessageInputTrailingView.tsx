import React from 'react';
import { StyleSheet, View } from 'react-native';

import { OutputButtons } from './components/OutputButtons';

import { audioRecorderSelector } from './utils/audioRecorderSelectors';

import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

export const MessageInputTrailingView = () => {
  const {
    theme: {
      messageInput: { outputButtonsContainer },
    },
  } = useTheme();
  const { audioRecorderManager } = useMessageInputContext();
  const { micLocked, recordingStatus } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );
  return (recordingStatus === 'idle' || recordingStatus === 'recording') && !micLocked ? (
    <View style={[styles.outputButtonsContainer, outputButtonsContainer]}>
      <OutputButtons />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  outputButtonsContainer: {
    alignSelf: 'flex-end',
    padding: primitives.spacingXs,
  },
});
