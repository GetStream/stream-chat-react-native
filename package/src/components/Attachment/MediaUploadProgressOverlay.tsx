import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type MediaUploadProgressOverlayProps = {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  testID?: string;
};

/**
 * Full-cover upload overlay for image and video thumbnails.
 */
export const MediaUploadProgressOverlay = ({
  progress,
  size = 18,
  strokeWidth = 3,
  testID,
}: MediaUploadProgressOverlayProps) => {
  const styles = useStyles();
  const { CircularProgressIndicator } = useComponentsContext();
  const {
    theme: {
      messageItemView: { attachmentUploadIndicator },
      semantics,
    },
  } = useTheme();

  return (
    <View
      pointerEvents='none'
      style={[
        StyleSheet.absoluteFill,
        styles.indicatorContainer,
        attachmentUploadIndicator.overlayContent,
      ]}
      testID={testID ? `${testID}-content` : undefined}
    >
      {typeof progress === 'number' ? (
        <CircularProgressIndicator
          backgroundColor={semantics.backgroundCoreElevation0}
          filledColor={semantics.accentPrimary}
          progress={progress}
          size={size}
          strokeWidth={strokeWidth}
          style={attachmentUploadIndicator.indicator}
          unfilledColor={semantics.borderCoreDefault}
        />
      ) : (
        <ActivityIndicator
          color={semantics.accentPrimary}
          style={attachmentUploadIndicator.indicator}
        />
      )}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        indicatorContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: semantics.backgroundCoreOverlayLight,
        },
      }),
    [semantics],
  );
};
