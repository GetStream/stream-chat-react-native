import React from 'react';
import { StyleSheet } from 'react-native';

import Animated from 'react-native-reanimated';

import { OutputButtons } from './components/OutputButtons';

import { audioRecorderSelector } from './utils/audioRecorderSelectors';

import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';
import { transitions } from '../../utils/transitions';

export const MessageInputTrailingView = () => {
  const {
    theme: {
      messageComposer: { outputButtonsContainer },
    },
  } = useTheme();
  const { audioRecorderManager } = useMessageInputContext();
  const { micLocked, recordingStatus } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );
  return (recordingStatus === 'idle' || recordingStatus === 'recording') && !micLocked ? (
    <Animated.View
      layout={transitions.layout200}
      style={[styles.outputButtonsContainer, outputButtonsContainer]}
    >
      <OutputButtons />
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  outputButtonsContainer: {
    alignSelf: 'flex-end',
    padding: primitives.spacingXs,
  },
});
