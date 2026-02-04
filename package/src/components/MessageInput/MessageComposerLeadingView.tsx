import React from 'react';
import { StyleSheet } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { InputButtons } from './components/InputButtons';
import { idleRecordingStateSelector } from './utils/audioRecorderSelectors';

import { useMessageInputContext } from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';

export const MessageComposerLeadingView = () => {
  const {
    theme: {
      messageInput: { inputButtonsContainer },
    },
  } = useTheme();
  const { audioRecorderManager, messageInputFloating } = useMessageInputContext();
  const { isRecordingStateIdle } = useStateStore(
    audioRecorderManager.state,
    idleRecordingStateSelector,
  );

  return isRecordingStateIdle ? (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[
        styles.inputButtonsContainer,
        messageInputFloating ? styles.shadow : null,
        inputButtonsContainer,
      ]}
    >
      <InputButtons />
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  inputButtonsContainer: {
    alignSelf: 'flex-end',
  },
  shadow: {
    elevation: 6,

    shadowColor: 'hsla(0, 0%, 0%, 0.24)',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
  },
});
