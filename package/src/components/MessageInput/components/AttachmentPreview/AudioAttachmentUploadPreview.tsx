import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { FileReference, LocalAudioAttachment, LocalVoiceRecordingAttachment } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentRemoveControl';
import { AttachmentUnsupportedIndicator } from './AttachmentUnsupportedIndicator';
import { AttachmentUploadProgressIndicator } from './AttachmentUploadProgressIndicator';

import { AudioAttachment } from '../../../../components/Attachment/AudioAttachment';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
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
  const styles = useStyles();
  const { enableOfflineSupport } = useChatContext();
  const indicatorType = getIndicatorTypeForFileState(
    attachment.localMetadata.uploadState,
    enableOfflineSupport,
  );
  const messageComposer = useMessageComposer();
  const isDraft = messageComposer.draftId;
  const isEditing = messageComposer.editedMessage;
  const assetUrl =
    (isDraft || isEditing
      ? attachment.asset_url
      : (attachment.localMetadata.file as FileReference).uri) ??
    (attachment.localMetadata.file as FileReference).uri;

  const finalAttachment = useMemo(
    () => ({
      ...attachment,
      asset_url: assetUrl,
      id: attachment.localMetadata.id,
    }),
    [attachment, assetUrl],
  );

  const onRetryHandler = useCallback(() => {
    handleRetry(attachment);
  }, [attachment, handleRetry]);

  const onDismissHandler = useCallback(() => {
    removeAttachments([attachment.localMetadata.id]);
  }, [attachment, removeAttachments]);

  return (
    <View style={styles.wrapper} testID={'audio-attachment-upload-preview'}>
      <AttachmentUploadProgressIndicator
        onPress={onRetryHandler}
        style={styles.overlay}
        type={indicatorType}
      >
        <AudioAttachment
          isPreview={true}
          item={finalAttachment}
          showSpeedSettings={false}
          titleMaxLength={12}
          maxAmplitudesCount={25}
        />
      </AttachmentUploadProgressIndicator>
      <View style={styles.dismissWrapper}>
        <AttachmentRemoveControl onPress={onDismissHandler} />
      </View>
      {indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED ? (
        <AttachmentUnsupportedIndicator indicatorType={indicatorType} isImage={true} />
      ) : null}
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { radius, spacing },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        dismissWrapper: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
        overlay: {
          borderRadius: radius.lg,
        },
        wrapper: {
          padding: spacing.xxs,
        },
      }),
    [radius, spacing],
  );
};
