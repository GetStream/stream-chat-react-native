import React, { useCallback, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import { FileReference, LocalAudioAttachment, LocalVoiceRecordingAttachment } from 'stream-chat';

import { AttachmentRemoveControl } from './AttachmentRemoveControl';
import {
  FileUploadNotSupportedIndicator,
  FileUploadRetryIndicator,
  FileUploadInProgressIndicator,
} from './AttachmentUploadProgressIndicator';

import { AudioAttachment } from '../../../../components/Attachment/Audio';
import { useTheme } from '../../../../contexts';
import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import { useMessageComposer } from '../../../../contexts/messageInputContext/hooks/useMessageComposer';
import { primitives } from '../../../../theme';
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

  const renderIndicator = useMemo(() => {
    if (indicatorType === ProgressIndicatorTypes.IN_PROGRESS) {
      return <FileUploadInProgressIndicator />;
    }
    if (indicatorType === ProgressIndicatorTypes.RETRY) {
      return <FileUploadRetryIndicator onPress={onRetryHandler} />;
    }
    if (indicatorType === ProgressIndicatorTypes.NOT_SUPPORTED) {
      return <FileUploadNotSupportedIndicator localMetadata={attachment.localMetadata} />;
    }
    return null;
  }, [attachment.localMetadata, indicatorType, onRetryHandler]);

  return (
    <View style={styles.wrapper} testID={'audio-attachment-upload-preview'}>
      <AudioAttachment
        isPreview={true}
        item={finalAttachment}
        showSpeedSettings={true}
        containerStyle={styles.audioAttachmentContainer}
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
  return useMemo(
    () =>
      StyleSheet.create({
        dismissWrapper: {
          position: 'absolute',
          right: 0,
          top: 0,
        },
        wrapper: {
          padding: primitives.spacingXxs,
        },
        audioAttachmentContainer: {
          borderRadius: primitives.radiusLg,
          borderColor: semantics.borderCoreDefault,
          borderWidth: 1,
          maxWidth: 256, // TODO: Fix this
        },
      }),
    [semantics.borderCoreDefault],
  );
};
