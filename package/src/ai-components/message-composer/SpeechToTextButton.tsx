import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Pressable, StyleSheet, View } from 'react-native';
import { Mic } from '../internal/icons/Mic';
import React, { useEffect } from 'react';
import { useDictation } from '../transcription/useDictation';
import { useTheme } from '../contexts';
import { useStateStore } from '@stream-io/state-store/react-bindings';
import { dictationStore, type DictationStoreState } from '../store';
import type { DictationStartOptions } from '../native-specs/NativeAIDictation';

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

export const SpeechToTextButton = ({
  options,
}: {
  options?: DictationStartOptions;
}) => {
  const {
    theme: {
      colors: { grey, accent_blue },
      composer: { iconButton, micIcon },
    },
  } = useTheme();

  const { cancel, toggle } = useDictation(options);
  const { isRecording } = useStateStore(dictationStore, selector);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return (
    <Animated.View
      key={'mic-button'}
      entering={ZoomIn.duration(250)}
      exiting={ZoomOut.duration(250)}
    >
      <Pressable style={[styles.iconButton, iconButton]} onPress={toggle}>
        <View style={[styles.micIcon, micIcon]}>
          <Mic
            size={32}
            viewBox={`0 0 ${32} ${28}`}
            fill={isRecording ? accent_blue : grey}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  micIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
