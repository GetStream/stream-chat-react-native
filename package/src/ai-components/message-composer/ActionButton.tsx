import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';
import { SendUp } from '../internal/icons/SendUp';
import React, { useMemo } from 'react';
import {
  dictationStore,
  type DictationStoreState,
  useComposerHasText,
} from '../store';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { useMessageComposerContext, useTheme } from '../contexts';
import type { ComposerViewProps } from './ComposerView';
import { CircleStop } from '../internal/icons/CircleStop';
import { SpeechToTextButton } from './SpeechToTextButton';

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

export const ActionButton = ({
  isGenerating,
  stopGenerating,
}: Pick<ComposerViewProps, 'isGenerating' | 'stopGenerating'>) => {
  const { hasText } = useComposerHasText();
  const { isRecording } = useStateStore(dictationStore, selector);
  const { sendMessage } = useMessageComposerContext();
  const {
    theme: {
      colors: { black, white },
      composer: { iconButton, stopGeneratingIcon, sendIcon },
    },
  } = useTheme();
  const styles = useStyles();

  if (isGenerating) {
    return (
      <Animated.View
        key={'stop-generating'}
        entering={ZoomIn.duration(250)}
        exiting={ZoomOut.duration(250)}
      >
        <Pressable
          style={[styles.iconButton, iconButton]}
          onPress={stopGenerating}
        >
          <View style={[styles.stopGeneratingIcon, stopGeneratingIcon]}>
            <CircleStop fill={black} size={32} />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return hasText && !isRecording ? (
    <Animated.View
      key={'send-button'}
      entering={ZoomIn.duration(250)}
      exiting={ZoomOut.duration(250)}
    >
      <Pressable style={[styles.iconButton, iconButton]} onPress={sendMessage}>
        <View style={[styles.sendIcon, sendIcon]}>
          <SendUp pathFill={white} size={24} />
        </View>
      </Pressable>
    </Animated.View>
  ) : (
    <SpeechToTextButton />
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        micIcon: {
          width: 32,
          height: 32,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sendIcon: {
          width: 32,
          height: 32,
          backgroundColor: theme.colors.black,
          borderRadius: 16,
        },
        stopGeneratingIcon: {
          width: 32,
          height: 32,
          backgroundColor: theme.colors.transparent,
          borderRadius: 16,
        },
        iconButton: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [theme],
  );
};
