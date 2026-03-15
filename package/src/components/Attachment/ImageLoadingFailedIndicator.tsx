import React, { useMemo } from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, ViewProps } from 'react-native';

import { useMessageContext } from '../../contexts/messageContext/MessageContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { RetryBadge } from '../ui/Badge/RetryBadge';

export type ImageLoadingFailedIndicatorProps = ViewProps & {
  /**
   * Callback to reload the image
   * @returns Callback to reload the image
   */
  onReloadImage: () => void;
};

export const ImageLoadingFailedIndicator = ({
  onReloadImage,
}: ImageLoadingFailedIndicatorProps) => {
  const styles = useStyles();
  const { onLongPress: longPressHandler } = useMessageContext();

  const onLongPress = useStableCallback((event: GestureResponderEvent) => {
    if (longPressHandler) {
      longPressHandler({
        emitter: 'failed-image',
        event,
      });
    }
  });

  return (
    <Pressable
      accessibilityLabel='Image Loading Error Indicator'
      onLongPress={onLongPress}
      onPress={onReloadImage}
      style={styles.imageLoadingErrorIndicatorStyle}
    >
      <RetryBadge size='lg' />
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      imageLoadingErrorIndicatorStyle: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: semantics.backgroundCoreOverlayLight,
      },
    });
  }, [semantics]);
};
