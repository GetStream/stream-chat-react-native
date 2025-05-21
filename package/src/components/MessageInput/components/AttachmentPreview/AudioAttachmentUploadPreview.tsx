import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { LocalAudioAttachment, LocalVoiceRecordingAttachment } from 'stream-chat';

import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';
import { DismissAttachmentUpload } from './DismissAttachmentUpload';

import { AudioAttachment } from '../../../../components/Attachment/AudioAttachment';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { AudioConfig, UploadAttachmentPreviewProps } from '../../../../types/types';
import { getIndicatorTypeForFileState } from '../../../../utils/utils';

export type AudioAttachmentUploadPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<
    LocalAudioAttachment<CustomLocalMetadata> | LocalVoiceRecordingAttachment<CustomLocalMetadata>
  > & {
    audioAttachmentConfig: AudioConfig;
    onLoad: (index: string, duration: number) => void;
    onPlayPause: (index: string, pausedStatus?: boolean) => void;
    onProgress: (index: string, progress: number) => void;
  };

export const AudioAttachmentUploadPreview = ({
  attachment,
  audioAttachmentConfig,
  handleRetry,
  removeAttachments,
  onLoad,
  onPlayPause,
  onProgress,
}: AudioAttachmentUploadPreviewProps) => {
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );

  const finalAttachment = useMemo(
    () => ({
      asset_url: attachment.asset_url,
      id: attachment.localMetadata.id,
      title: attachment.title,
      type: attachment.type,
      waveform_data: attachment.waveform_data,
      ...audioAttachmentConfig,
    }),
    [attachment, audioAttachmentConfig],
  );

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  return (
    <>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={styles.overlay}
        type={indicatorType}
      >
        <AudioAttachment
          hideProgressBar={true}
          item={finalAttachment}
          onLoad={onLoad}
          onPlayPause={onPlayPause}
          onProgress={onProgress}
          showSpeedSettings={false}
          testID='audio-attachment-upload-preview'
        />
      </AttachmentUploadProgressIndicator>
      <View style={styles.dismissWrapper}>
        <DismissAttachmentUpload onPress={onDismissHandler} />
      </View>
    </>
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
