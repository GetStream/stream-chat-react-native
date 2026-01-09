import React, { useCallback, useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { LocalImageAttachment } from 'stream-chat';

import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

const IMAGE_PREVIEW_SIZE = 72;

export type ImageAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalImageAttachment<CustomLocalMetadata>>;

export const ImageAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: ImageAttachmentUploadPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = loading
    ? ProgressIndicatorTypes.IN_PROGRESS
    : getIndicatorTypeForFileState(attachment.localMetadata.uploadState, enableOfflineSupport);

  const {
    theme: {
      messageInput: {
        imageAttachmentUploadPreview: { container, upload },
      },
    },
  } = useTheme();

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  const onLoadEndHandler = useCallback(() => {
    setLoading(false);
  }, []);

  const onErrorHandler = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={[styles.container, container]}
        type={indicatorType}
      >
        <Image
          onError={onErrorHandler}
          onLoadEnd={onLoadEndHandler}
          resizeMode='cover'
          source={{ uri: attachment.localMetadata.previewUri ?? attachment.image_url }}
          style={[styles.upload, upload]}
          testID={'image-attachment-upload-preview-image'}
        />
        {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
          <AttachmentUnsupportedIndicator indicatorType={indicatorType} isImage={true} />
        ) : null}
      </AttachmentUploadProgressIndicator>

      <View style={styles.dismissWrapper}>
        <DismissAttachmentUpload onPress={onDismissHandler} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: '#E2E6EA',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dismissWrapper: { position: 'absolute', right: -4, top: -4 },
  fileSizeText: {
    fontSize: 12,
    paddingHorizontal: 10,
  },
  upload: {
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
  wrapper: {},
});
