import React, { useCallback } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { LocalVideoAttachment } from 'stream-chat';

import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { Recorder } from '../../../../icons/Recorder';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

const IMAGE_PREVIEW_SIZE = 100;

export type VideoAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<LocalVideoAttachment<CustomLocalMetadata>>;

export const VideoAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: VideoAttachmentUploadPreviewProps) => {
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const {
    theme: {
      colors: { white },
      messageInput: {
        videoAttachmentUploadPreview: {
          itemContainer,
          recorderIcon,
          recorderIconContainer,
          upload,
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
    <View style={[styles.itemContainer, itemContainer]}>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={styles.upload}
        type={indicatorType}
      >
        <Image
          resizeMode='cover'
          source={{ uri: attachment.thumb_url }}
          style={[styles.upload, upload]}
        />
        <View style={[styles.recorderIconContainer, recorderIconContainer]}>
          <Recorder height={20} pathFill={white} width={20} {...recorderIcon} />
        </View>
      </AttachmentUploadProgressIndicator>
      <DismissAttachmentUpload onPress={onDismissHandler} />
      {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
        <AttachmentUnsupportedIndicator indicatorType={indicatorType} />
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
  recorderIconContainer: {
    bottom: 8,
    left: 8,
    position: 'absolute',
  },
  upload: {
    borderRadius: 10,
    height: IMAGE_PREVIEW_SIZE,
    width: IMAGE_PREVIEW_SIZE,
  },
});
