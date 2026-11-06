import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';

export const useCreateInputMessageInputContext = ({
  additionalTextInputProps,
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
  focusInputOnPickerClose,
  handleAttachButtonPress,
  hasCameraPicker,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  messageInputFloating,
  messageInputHeightStore,
  openPollCreationDialog,
  setInputRef,
  showPollCreationDialog,
}: InputMessageInputContextValue & {
  /** Re-creates the context when the channel changes. */
  channelId?: string;
}) => {
  const inputMessageInputContext: InputMessageInputContextValue = useMemo(
    () => ({
      additionalTextInputProps,
      asyncMessagesLockDistance,
      asyncMessagesMinimumPressDuration,
      asyncMessagesSlideToCancelDistance,
      audioRecordingSendOnComplete,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      audioRecordingEnabled,
      compressImageQuality,
      createPollOptionGap,
      focusInputOnPickerClose,
      handleAttachButtonPress,
      hasCameraPicker,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      messageInputFloating,
      messageInputHeightStore,
      openPollCreationDialog,
      setInputRef,
      showPollCreationDialog,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, compressImageQuality, hasCommands, showPollCreationDialog],
  );

  return inputMessageInputContext;
};
