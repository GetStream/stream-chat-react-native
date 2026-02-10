import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LocalAttachmentUploadMetadata } from 'stream-chat';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { NewExclamationCircle } from '../../../../icons/NewExclamationCircle';
import { NewWarning } from '../../../../icons/NewWarning';
import { RotateCircle } from '../../../../icons/RotateCircle';
import { primitives } from '../../../../theme';

export const FileUploadInProgressIndicator = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View style={styles.activityIndicatorContainer} testID='upload-progress-indicator'>
      <ActivityIndicator color={semantics.accentPrimary} style={styles.activityIndicator} />
    </View>
  );
};

export const FileUploadRetryIndicator = ({ onPress }: { onPress: () => void }) => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useFileUploadRetryStyles();

  return (
    <View style={styles.container} testID='inline-retry-indicator'>
      <View style={styles.networkErrorContainer}>
        <NewWarning
          height={16}
          fill={semantics.accentError}
          testID='retry-upload-progress-indicator'
          width={16}
        />
        <Text>Network error</Text>
      </View>
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
        <Text style={styles.retryText}>Retry Upload</Text>
      </Pressable>
    </View>
  );
};

export const FileUploadNotSupportedIndicator = ({
  localMetadata,
}: {
  localMetadata: LocalAttachmentUploadMetadata;
}) => {
  const styles = useFileUploadNotSupportedStyles();
  const {
    theme: { semantics },
  } = useTheme();

  const reason = localMetadata.uploadPermissionCheck?.reason === 'size_limit';
  const message = reason ? 'File too large' : 'Not supported';

  return (
    <View style={styles.container} testID='inline-not-supported-indicator'>
      <NewExclamationCircle height={16} width={16} fill={semantics.accentError} />
      <Text style={styles.notSupportedText}>{message}</Text>
    </View>
  );
};

export const ImageUploadInProgressIndicator = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useImageUploadInProgressIndicatorStyles();
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size='small'
        color={semantics.accentPrimary}
        testID='upload-progress-indicator'
      />
    </View>
  );
};

export const ImageUploadRetryIndicator = ({ onRetryHandler }: { onRetryHandler: () => void }) => {
  const styles = useImageUploadRetryIndicatorStyles();
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <Pressable
      style={styles.container}
      onPress={onRetryHandler}
      testID='retry-upload-progress-indicator'
    >
      <RotateCircle height={16} width={16} stroke={semantics.textOnAccent} />
    </Pressable>
  );
};

export const ImageUploadNotSupportedIndicator = () => {
  const styles = useImageUploadNotSupportedIndicatorStyles();
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <View style={styles.container} testID='inline-not-supported-indicator'>
      <NewExclamationCircle height={20} width={20} fill={semantics.accentError} />
    </View>
  );
};

const useImageUploadInProgressIndicatorStyles = () => {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: primitives.spacingXxs,
      bottom: primitives.spacingXxs,
    },
  });
};

const useImageUploadRetryIndicatorStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return StyleSheet.create({
    container: {
      backgroundColor: semantics.accentError,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: primitives.radiusMax,
      borderWidth: 2,
      borderColor: semantics.textOnAccent,
      alignSelf: 'center',
      width: 32,
      height: 32,
    },
  });
};

const useImageUploadNotSupportedIndicatorStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return StyleSheet.create({
    container: {
      backgroundColor: semantics.backgroundElevationElevation0,
      borderRadius: primitives.radiusMax,
      position: 'absolute',
      left: primitives.spacingXxs,
      bottom: primitives.spacingXxs,
    },
  });
};

const useFileUploadRetryStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        gap: primitives.spacingXxxs,
      },
      networkErrorContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
      },
      networkErrorText: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      retryText: {
        color: semantics.textLink,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};

const useFileUploadNotSupportedStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxxs,
      },
      notSupportedText: {
        color: semantics.textSecondary,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};

const styles = StyleSheet.create({
  activityIndicatorContainer: {},
  activityIndicator: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
