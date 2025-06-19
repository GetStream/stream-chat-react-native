import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ArrowUp, Lock } from '../../../../icons';

export type AudioRecordingLockIndicatorProps = {
  /**
   * Boolean used to show if the voice recording state is locked. This makes sure the mic button shouldn't be pressed any longer.
   * When the mic is locked the `AudioRecordingInProgress` component shows up.
   */
  micLocked: boolean;
  /**
   * Height of the message input, to apply necessary position adjustments to this component.
   */
  messageInputHeight?: number;
  /**
   * Styles of the lock indicator.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Component displayed to show the lock state of the recording when the button is slided up.
 */
export const AudioRecordingLockIndicator = ({
  messageInputHeight,
  micLocked,
  style,
}: AudioRecordingLockIndicatorProps) => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<number>(undefined);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (micLocked) {
        setVisible(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [micLocked]);

  const {
    theme: {
      colors: { accent_blue, grey, light_gray },
      messageInput: {
        audioRecordingLockIndicator: { arrowUpIcon, container, lockIcon },
      },
    },
  } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { backgroundColor: light_gray, bottom: messageInputHeight },
        container,
      ]}
    >
      <Lock color={micLocked ? accent_blue : grey} size={32} {...lockIcon} />
      {!micLocked && <ArrowUp color={grey} size={32} {...arrowUpIcon} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 50,
    margin: 5,
    padding: 8,
    position: 'absolute',
    right: 0,
  },
});
