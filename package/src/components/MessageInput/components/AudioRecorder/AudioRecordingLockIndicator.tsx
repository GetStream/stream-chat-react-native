import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ChevronTop } from '../../../../icons/ChevronTop';
import { Lock } from '../../../../icons/Lock';
import { Unlock } from '../../../../icons/Unlock';
import { AudioRecorderManagerState } from '../../../../state-store/audio-recorder-manager';
import { primitives } from '../../../../theme';

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
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
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
      semantics,
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
        <Lock stroke={semantics.accentPrimary} height={20} width={20} />
      ) : (
        <Unlock stroke={semantics.textPrimary} height={20} width={20} {...lockIcon} />
      )}
      {!micLocked && (
        <ChevronTop stroke={semantics.textPrimary} height={20} width={20} {...arrowUpIcon} />
      )}
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: {
      colors: { white },
      semantics,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: white,
          borderColor: semantics.borderCoreDefault,
          borderWidth: 1,
          borderRadius: primitives.radiusMax,
          padding: primitives.spacingXs,
          gap: primitives.spacingXxs,

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
    [white, semantics.borderCoreDefault],
  );
};
