import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';

import { useStateStore } from '@stream-io/state-store/react-bindings';

import { useTheme } from '../contexts';
import { Mic } from '../internal/icons/Mic';

import { isDictationAvailable, warnIfDictationUnavailable } from '../native/AIDictation';
import type { DictationStartOptions } from '../native-specs/NativeAIDictation';
import { dictationStore, type DictationStoreState } from '../store';
import { useDictation } from '../transcription/useDictation';

const selector = ({ isRecording }: DictationStoreState) => ({
  isRecording,
});

type SpeechToTextButtonProps = {
  options?: DictationStartOptions;
};

/**
 * Renders nothing when the native dictation module is not part of the build (see
 * `isDictationAvailable`), so that pressing the button can never reach a missing module.
 */
export const SpeechToTextButton = (props: SpeechToTextButtonProps) => {
  if (!isDictationAvailable()) {
    warnIfDictationUnavailable();
    return null;
  }

  return <AvailableSpeechToTextButton {...props} />;
};

const AvailableSpeechToTextButton = ({ options }: SpeechToTextButtonProps) => {
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
          <Mic size={32} viewBox={`0 0 ${32} ${28}`} fill={isRecording ? accent_blue : grey} />
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
