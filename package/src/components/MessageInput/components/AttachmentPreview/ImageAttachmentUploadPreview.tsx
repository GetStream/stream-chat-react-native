import React, { useCallback } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { LocalImageAttachment } from 'stream-chat';

import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

const IMAGE_PREVIEW_SIZE = 100;

export type ImageAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalImageAttachment<CustomLocalMetadata>>;

export const ImageAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentUploadPreviewProps) => {
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const {
    theme: {
      messageInput: {
        imageAttachmentUploadPreview: { itemContainer, upload },
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
    <View style={[styles.itemContainer, itemContainer]}>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={styles.upload}
        type={indicatorType}
      >
        <Image
          resizeMode='cover'
          source={{ uri: attachment.localMetadata.previewUri ?? attachment.image_url }}
          style={[styles.upload, upload]}
        />
      </AttachmentUploadProgressIndicator>
      <DismissAttachmentUpload onPress={onDismissHandler} />
      {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
        <AttachmentUnsupportedIndicator indicatorType={indicatorType} isImage={true} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fileSizeText: {
    fontSize: 12,
    paddingHorizontal: 10,
  },
  flatList: { paddingBottom: 12 },
  itemContainer: {
    flexDirection: 'row',
    height: IMAGE_PREVIEW_SIZE,
    marginLeft: 8,
  },
  upload: {
    borderRadius: 10,
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
});
