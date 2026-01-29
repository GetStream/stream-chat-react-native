import React, { useCallback, useMemo } from 'react';

import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { LocalAudioAttachment, LocalFileAttachment, LocalVideoAttachment } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentRemoveControl';
import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';

import { getFileSizeDisplayText } from '../../../../components/Attachment/FileAttachment';
import { WritingDirectionAwareText } from '../../../../components/RTLComponents/WritingDirectionAwareText';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useMessagesContext } from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import {
  getDurationLabelFromDuration,
  getIndicatorTypeForFileState,
  ProgressIndicatorTypes,
} from '../../../../utils/utils';

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
  const { enableOfflineSupport } = useChatContext();
  const { FileAttachmentIcon } = useMessagesContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const {
    theme: {
      messageInput: {
        fileAttachmentUploadPreview: {
          fileContainer,
          filenameText,
          fileSizeText,
          fileTextContainer,
          uploadProgressOverlay,
          wrapper,
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  return (
    <View style={[styles.wrapper, wrapper]} testID={'file-attachment-upload-preview'}>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={[styles.overlay, uploadProgressOverlay]}
        type={indicatorType}
      >
        <View style={[styles.fileContainer, fileContainer]}>
          <View style={styles.fileIcon}>
            <FileAttachmentIcon mimeType={attachment.mime_type} size={40} />
          </View>
          <View style={[styles.fileContent, fileTextContainer]}>
            <Text
              numberOfLines={1}
              style={[
                styles.filenameText,
                I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
                filenameText,
              ]}
            >
              {attachment.title}
            </Text>
            {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
              <AttachmentUnsupportedIndicator indicatorType={indicatorType} />
            ) : (
              <WritingDirectionAwareText style={[styles.fileSizeText, fileSizeText]}>
                {attachment.duration
                  ? getDurationLabelFromDuration(attachment.duration)
                  : getFileSizeDisplayText(attachment.file_size)}
              </WritingDirectionAwareText>
            )}
          </View>
        </View>
      </AttachmentUploadProgressIndicator>
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

  const { borderCoreDefault, textPrimary, textSecondary } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        dismissWrapper: { position: 'absolute', right: 0, top: 0 },
        fileContainer: {
          borderRadius: primitives.radiusLg,
          borderColor: borderCoreDefault,
          borderWidth: 1,
          flexDirection: 'row',
          gap: primitives.spacingSm,
          width: 224, // TODO: Not sure how to omit this
          padding: primitives.spacingMd,
        },
        fileContent: {
          flexShrink: 1,
          justifyContent: 'space-between',
        },
        fileIcon: {
          alignItems: 'center',
          alignSelf: 'center',
          justifyContent: 'center',
        },
        filenameText: {
          color: textPrimary,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
        fileSizeText: {
          color: textSecondary,
          fontSize: primitives.typographyFontSizeXs,
        },
        overlay: {
          borderRadius: primitives.radiusLg,
        },
        wrapper: {
          padding: primitives.spacingXxs,
        },
      }),
    [borderCoreDefault, textPrimary, textSecondary],
  );
};
