import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { FileReference, LocalAudioAttachment, LocalVoiceRecordingAttachment } from 'stream-chat';

import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { AudioAttachment } from '../../../../components/Attachment/AudioAttachment';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState, ProgressIndicatorTypes } from '../../../../utils/utils';

export type AudioAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<
    LocalAudioAttachment<CustomLocalMetadata> | LocalVoiceRecordingAttachment<CustomLocalMetadata>
  >;

export const AudioAttachmentUploadPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: AudioAttachmentUploadPreviewProps) => {
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const finalAttachment = useMemo(
    () => ({
      ...attachment,
      asset_url: attachment.asset_url ?? (attachment.localMetadata.file as FileReference).uri,
      id: attachment.localMetadata.id,
    }),
    [attachment],
  );

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  return (
    <View testID={'audio-attachment-upload-preview'}>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={styles.overlay}
        type={indicatorType}
      >
        <AudioAttachment
          hideProgressBar={true}
          item={finalAttachment}
          showSpeedSettings={false}
          titleMaxLength={12}
        />
      </AttachmentUploadProgressIndicator>
      <View style={styles.dismissWrapper}>
        <DismissAttachmentUpload onPress={onDismissHandler} />
      </View>
      {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
        <AttachmentUnsupportedIndicator indicatorType={indicatorType} isImage={true} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  dismissWrapper: {
    position: 'absolute',
    right: 8,
    top: 0,
  },
  overlay: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginTop: 2,
  },
});
