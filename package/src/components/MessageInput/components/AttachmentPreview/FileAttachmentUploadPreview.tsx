import React, { useCallback } from 'react';

import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { LocalAudioAttachment, LocalFileAttachment, LocalVideoAttachment } from 'stream-chat';

import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { getFileSizeDisplayText } from '../../../../components/Attachment/FileAttachment';
import { WritingDirectionAwareText } from '../../../../components/RTLComponents/WritingDirectionAwareText';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useMessagesContext } from '../../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getTrimmedAttachmentTitle } from '../../../../utils/getTrimmedAttachmentTitle';
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
  > & {
    flatListWidth: number;
  };

export const FileAttachmentUploadPreview = ({
  attachment,
  flatListWidth,
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
      colors: { black, grey, grey_whisper },
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
        style={[styles.overlay, { width: flatListWidth - 16 }, uploadProgressOverlay]}
        type={indicatorType}
      >
        <View
          style={[
            styles.fileContainer,
            {
              borderColor: grey_whisper,
            },
            fileContainer,
          ]}
        >
          <View style={styles.fileIcon}>
            <FileAttachmentIcon mimeType={attachment.mime_type} />
          </View>
          <View style={[styles.fileTextContainer, fileTextContainer]}>
            <Text
              numberOfLines={1}
              style={[
                styles.filenameText,
                {
                  color: black,
                  width:
                    flatListWidth -
                    16 - // 16 = horizontal padding
                    40 - // 40 = file icon size
                    24 - // 24 = close icon size
                    24, // 24 = internal padding
                },
                I18nManager.isRTL ? { writingDirection: 'rtl' } : { writingDirection: 'ltr' },
                filenameText,
              ]}
            >
              {getTrimmedAttachmentTitle(attachment.title)}
            </Text>
            {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
              <AttachmentUnsupportedIndicator indicatorType={indicatorType} />
            ) : (
              <WritingDirectionAwareText
                style={[styles.fileSizeText, { color: grey }, fileSizeText]}
              >
                {attachment.duration
                  ? getDurationLabelFromDuration(attachment.duration)
                  : getFileSizeDisplayText(attachment.file_size)}
              </WritingDirectionAwareText>
            )}
          </View>
        </View>
      </AttachmentUploadProgressIndicator>
      <DismissAttachmentUpload onPress={onDismissHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  fileContainer: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  fileIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  filenameText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fileSizeText: {
    fontSize: 12,
    marginTop: 10,
  },
  fileTextContainer: {
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  overlay: {
    borderRadius: 12,
    marginTop: 2,
  },
  wrapper: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
});
