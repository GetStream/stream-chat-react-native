import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewChevronLeft } from '../../../../icons/NewChevronTop';
import { NewLock } from '../../../../icons/NewLock';
import { NewUnlock } from '../../../../icons/NewUnlock';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';

export type AudioRecordingLockIndicatorProps = Pick<AudioRecorderManagerState, 'micLocked'> & {
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
  const styles = useStyles();

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
      colors: { text, accent },
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
      layout={LinearTransition.duration(200)}
      style={[styles.container, style, { bottom: messageInputHeight }, container]}
    >
      {micLocked ? (
        <NewLock stroke={accent.primary} height={20} width={20} />
      ) : (
        <NewUnlock stroke={text.primary} height={20} width={20} {...lockIcon} />
      )}
      {!micLocked && (
        <NewChevronLeft stroke={text.primary} height={20} width={20} {...arrowUpIcon} />
      )}
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: {
      colors: { white, border },
      radius,
      spacing,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: white,
          borderColor: border.default,
          borderWidth: 1,
          borderRadius: radius.full,
          padding: spacing.xs,
          gap: spacing.xxs,

          // Replace shadow styles with theme-based tokens when available
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        },
      }),
    [white, border, radius, spacing],
  );
};
