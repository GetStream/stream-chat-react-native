import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { LocalAudioAttachment, LocalFileAttachment, LocalVideoAttachment } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentRemoveControl';

import {
  InlineNotSupportedIndicator,
  InlineRetryIndicator,
  InProgressIndicator,
} from './AttachmentUploadProgressIndicator';

import { FilePreview } from '../../../../components/Attachment/FilePreview';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

export type FileAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<
    | LocalFileAttachment<CustomLocalMetadata>
    | LocalVideoAttachment<CustomLocalMetadata>
    | LocalAudioAttachment<CustomLocalMetadata>
  >;

export const FileAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: FileAttachmentUploadPreviewProps) => {
  const styles = useStyles();
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const {
    theme: {
      messageInput: {
        fileAttachmentUploadPreview: { wrapper },
      },
    },
  } = useTheme();

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  const renderIndicator = useMemo(() => {
    if (indicatorType === ProgressIndicatorTypes.IN_PROGRESS) {
      return <InProgressIndicator />;
    }
    if (indicatorType === ProgressIndicatorTypes.RETRY) {
      return <InlineRetryIndicator onPress={onRetryHandler} />;
    }
    if (indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED) {
      return <InlineNotSupportedIndicator localMetadata={attachment.localMetadata} />;
    }
    return null;
  }, [attachment.localMetadata, indicatorType, onRetryHandler]);

  return (
    <View style={[styles.wrapper, wrapper]} testID={'file-attachment-upload-preview'}>
      <FilePreview
        attachment={attachment}
        attachmentIconSize={40}
        titleNumberOfLines={1}
        styles={{ container: styles.fileContainer }}
        indicator={renderIndicator}
      />
      <View style={styles.dismissWrapper}>
        <AttachmentRemoveControl onPress={onDismissHandler} />
      </View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { borderCoreDefault } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        dismissWrapper: { position: 'absolute', right: 0, top: 0 },
        fileContainer: {
          borderRadius: primitives.radiusLg,
          borderColor: borderCoreDefault,
          borderWidth: 1,
          padding: primitives.spacingMd,
          paddingRight: primitives.spacingSm,
        },
        overlay: {
          borderRadius: primitives.radiusLg,
        },
        wrapper: {
          padding: primitives.spacingXxs,
        },
      }),
    [borderCoreDefault],
  );
};
