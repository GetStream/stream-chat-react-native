import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import Animated from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ArrowUp, Lock } from '../../../../icons';

export type AudioRecordingLockIndicatorProps = {
  locked?: boolean;
  messageInputHeight?: number;
  style?: StyleProp<ViewStyle>;
};

export const AudioRecordingLockIndicator = ({
  locked,
  messageInputHeight,
  style,
}: AudioRecordingLockIndicatorProps) => {
  const [visible, setVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timer>();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (locked) {
        setVisible(false);
      }
    }, 2000);

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [locked]);

  const {
    theme: {
      colors: { accent_blue, grey, light_gray },
    },
  } = useTheme();

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, style, { backgroundColor: light_gray, bottom: messageInputHeight }]}
    >
      <Lock color={locked ? accent_blue : grey} size={32} />
      {!locked && <ArrowUp color={grey} size={32} />}
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
    zIndex: 1,
  },
});
