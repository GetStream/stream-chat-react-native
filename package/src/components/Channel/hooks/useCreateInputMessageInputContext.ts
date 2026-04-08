import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';

export const useCreateInputMessageInputContext = ({
  additionalTextInputProps,
  allowSendBeforeAttachmentsUpload,
  asyncMessagesLockDistance,
  asyncMessagesMinimumPressDuration,
  asyncMessagesSlideToCancelDistance,
  audioRecordingSendOnComplete,
  attachmentPickerBottomSheetHeight,
  attachmentSelectionBarHeight,
  audioRecordingEnabled,
  channelId,
  compressImageQuality,
  createPollOptionGap,
  doFileUploadRequest,
  editMessage,
  handleAttachButtonPress,
  hasCameraPicker,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  messageInputFloating,
  messageInputHeightStore,
  openPollCreationDialog,
  sendMessage,
  setInputRef,
  showPollCreationDialog,
}: InputMessageInputContextValue & {
  /**
   * To ensure we allow re-render, when channel is changed
   */
  channelId?: string;
}) => {
  const inputMessageInputContext: InputMessageInputContextValue = useMemo(
    () => ({
      additionalTextInputProps,
      allowSendBeforeAttachmentsUpload,
      asyncMessagesLockDistance,
      asyncMessagesMinimumPressDuration,
      asyncMessagesSlideToCancelDistance,
      audioRecordingSendOnComplete,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      audioRecordingEnabled,
      compressImageQuality,
      createPollOptionGap,
      doFileUploadRequest,
      editMessage,
      handleAttachButtonPress,
      hasCameraPicker,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      messageInputFloating,
      messageInputHeightStore,
      openPollCreationDialog,
      sendMessage,
      setInputRef,
      showPollCreationDialog,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compressImageQuality, channelId, showPollCreationDialog, allowSendBeforeAttachmentsUpload],
  );

  return inputMessageInputContext;
};
