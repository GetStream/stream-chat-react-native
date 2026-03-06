import React, { useMemo } from 'react';
import { Pressable, StyleSheet, ViewProps } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
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

  return (
    <Pressable
      accessibilityLabel='Image Loading Error Indicator'
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
