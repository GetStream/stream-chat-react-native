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
    theme: {
      semantics,
      messageInput: { fileUploadInProgressIndicator },
    },
  } = useTheme();

  return (
    <View
      style={[styles.activityIndicatorContainer, fileUploadInProgressIndicator.container]}
      testID='upload-progress-indicator'
    >
      <ActivityIndicator
        color={semantics.accentPrimary}
        style={[styles.activityIndicator, fileUploadInProgressIndicator.indicator]}
      />
    </View>
  );
};

export type FileUploadRetryIndicatorProps = {
  onPress: () => void;
};

export const FileUploadRetryIndicator = ({ onPress }: FileUploadRetryIndicatorProps) => {
  const {
    theme: {
      semantics,
      messageInput: { fileUploadRetryIndicator },
    },
  } = useTheme();
  const styles = useFileUploadRetryStyles();

  return (
    <View
      style={[styles.container, fileUploadRetryIndicator.container]}
      testID='inline-retry-indicator'
    >
      <View style={[styles.networkErrorContainer, fileUploadRetryIndicator.networkErrorContainer]}>
        <NewWarning
          height={16}
          fill={semantics.accentError}
          testID='retry-upload-progress-indicator'
          width={16}
        />
        <Text style={[styles.networkErrorText, fileUploadRetryIndicator.networkErrorText]}>
          Network error
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          { opacity: pressed ? 0.8 : 1 },
          fileUploadRetryIndicator.retryButton,
        ]}
      >
        <Text style={[styles.retryText, fileUploadRetryIndicator.retryText]}>Retry Upload</Text>
      </Pressable>
    </View>
  );
};

export type FileUploadNotSupportedIndicatorProps = {
  localMetadata: LocalAttachmentUploadMetadata;
};

export const FileUploadNotSupportedIndicator = ({
  localMetadata,
}: FileUploadNotSupportedIndicatorProps) => {
  const styles = useFileUploadNotSupportedStyles();
  const {
    theme: {
      semantics,
      messageInput: { fileUploadNotSupportedIndicator },
    },
  } = useTheme();

  const reason = localMetadata.uploadPermissionCheck?.reason === 'size_limit';
  const message = reason ? 'File too large' : 'Not supported';

  return (
    <View
      style={[styles.container, fileUploadNotSupportedIndicator.container]}
      testID='inline-not-supported-indicator'
    >
      <NewExclamationCircle height={16} width={16} fill={semantics.accentError} />
      <Text style={[styles.notSupportedText, fileUploadNotSupportedIndicator.notSupportedText]}>
        {message}
      </Text>
    </View>
  );
};

export const ImageUploadInProgressIndicator = () => {
  const {
    theme: {
      semantics,
      messageInput: { imageUploadInProgressIndicator },
    },
  } = useTheme();
  const styles = useImageUploadInProgressIndicatorStyles();
  return (
    <View style={[styles.container, imageUploadInProgressIndicator.container]}>
      <ActivityIndicator
        size='small'
        color={semantics.accentPrimary}
        style={imageUploadInProgressIndicator.indicator}
        testID='upload-progress-indicator'
      />
    </View>
  );
};

export type ImageUploadRetryIndicatorProps = {
  onRetryHandler: () => void;
};

export const ImageUploadRetryIndicator = ({ onRetryHandler }: ImageUploadRetryIndicatorProps) => {
  const styles = useImageUploadRetryIndicatorStyles();
  const {
    theme: {
      semantics,
      messageInput: { imageUploadRetryIndicator },
    },
  } = useTheme();
  return (
    <Pressable
      style={[styles.container, imageUploadRetryIndicator.container]}
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
    theme: {
      semantics,
      messageInput: { imageUploadNotSupportedIndicator },
    },
  } = useTheme();
  return (
    <View
      style={[styles.container, imageUploadNotSupportedIndicator.container]}
      testID='inline-not-supported-indicator'
    >
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
