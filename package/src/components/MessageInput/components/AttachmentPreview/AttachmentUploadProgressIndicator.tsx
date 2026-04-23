import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LocalAttachmentUploadMetadata } from 'stream-chat';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ExclamationCircle } from '../../../../icons/exclamation-circle-fill';
import { Warning } from '../../../../icons/exclamation-triangle-fill';
import { primitives } from '../../../../theme';
import { RetryBadge } from '../../../ui/Badge/RetryBadge';

export type UploadInProgressIndicatorProps = {
  localId?: string;
  sourceUrl?: string;
};

export const FileUploadInProgressIndicator = ({
  localId,
  sourceUrl,
}: UploadInProgressIndicatorProps = {}) => {
  const {
    theme: {
      messageComposer: { fileUploadInProgressIndicator },
    },
  } = useTheme();
  const { AttachmentUploadIndicator } = useComponentsContext();

  return (
    <AttachmentUploadIndicator
      containerStyle={[styles.activityIndicatorContainer, fileUploadInProgressIndicator.container]}
      localId={localId}
      sourceUrl={sourceUrl}
      style={[styles.activityIndicator, fileUploadInProgressIndicator.indicator]}
      testID='upload-progress-indicator'
    />
  );
};

export type FileUploadRetryIndicatorProps = {
  onPress: () => void;
};

export const FileUploadRetryIndicator = ({ onPress }: FileUploadRetryIndicatorProps) => {
  const {
    theme: {
      semantics,
      messageComposer: { fileUploadRetryIndicator },
    },
  } = useTheme();
  const styles = useFileUploadRetryStyles();

  return (
    <View
      style={[styles.container, fileUploadRetryIndicator.container]}
      testID='inline-retry-indicator'
    >
      <View style={[styles.networkErrorContainer, fileUploadRetryIndicator.networkErrorContainer]}>
        <Warning
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
      messageComposer: { fileUploadNotSupportedIndicator },
    },
  } = useTheme();

  const reason = localMetadata.uploadPermissionCheck?.reason === 'size_limit';
  const message = reason ? 'File too large' : 'Not supported';

  return (
    <View
      style={[styles.container, fileUploadNotSupportedIndicator.container]}
      testID='inline-not-supported-indicator'
    >
      <ExclamationCircle height={16} width={16} fill={semantics.accentError} />
      <Text style={[styles.notSupportedText, fileUploadNotSupportedIndicator.notSupportedText]}>
        {message}
      </Text>
    </View>
  );
};

export const ImageUploadInProgressIndicator = ({
  localId,
  sourceUrl,
}: UploadInProgressIndicatorProps = {}) => {
  const { AttachmentUploadIndicator } = useComponentsContext();

  return (
    <AttachmentUploadIndicator
      localId={localId}
      sourceUrl={sourceUrl}
      testID='upload-progress-indicator'
      variant='overlay'
    />
  );
};

export type ImageUploadRetryIndicatorProps = {
  onRetryHandler: () => void;
};

export const ImageUploadRetryIndicator = ({ onRetryHandler }: ImageUploadRetryIndicatorProps) => {
  return (
    <Pressable onPress={onRetryHandler} testID='retry-upload-progress-indicator'>
      <RetryBadge size='md' />
    </Pressable>
  );
};

export const ImageUploadNotSupportedIndicator = () => {
  const styles = useImageUploadNotSupportedIndicatorStyles();
  const {
    theme: {
      semantics,
      messageComposer: { imageUploadNotSupportedIndicator },
    },
  } = useTheme();
  return (
    <View
      style={[styles.container, imageUploadNotSupportedIndicator.container]}
      testID='inline-not-supported-indicator'
    >
      <ExclamationCircle height={20} width={20} fill={semantics.accentError} />
    </View>
  );
};

const useImageUploadNotSupportedIndicatorStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return StyleSheet.create({
    container: {
      backgroundColor: semantics.backgroundCoreElevation0,
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
  activityIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
});
