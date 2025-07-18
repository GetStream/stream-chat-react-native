import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';

export const useCreateInputMessageInputContext = ({
  additionalTextInputProps,
  asyncMessagesLockDistance,
  asyncMessagesMinimumPressDuration,
  asyncMessagesMultiSendEnabled,
  asyncMessagesSlideToCancelDistance,
  AttachButton,
  AttachmentPickerBottomSheetHandle,
  attachmentPickerBottomSheetHandleHeight,
  attachmentPickerBottomSheetHeight,
  AttachmentPickerSelectionBar,
  attachmentSelectionBarHeight,
  AttachmentUploadPreviewList,
  AttachmentUploadProgressIndicator,
  AudioAttachmentUploadPreview,
  AudioRecorder,
  audioRecordingEnabled,
  AudioRecordingInProgress,
  AudioRecordingLockIndicator,
  AudioRecordingPreview,
  AudioRecordingWaveform,
  AutoCompleteSuggestionHeader,
  AutoCompleteSuggestionItem,
  AutoCompleteSuggestionList,
  channelId,
  CameraSelectorIcon,
  CommandInput,
  CommandsButton,
  compressImageQuality,
  CooldownTimer,
  CreatePollContent,
  CreatePollIcon,
  doFileUploadRequest,
  editMessage,
  FileAttachmentUploadPreview,
  FileSelectorIcon,
  handleAttachButtonPress,
  hasCameraPicker,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  ImageAttachmentUploadPreview,
  ImageSelectorIcon,
  Input,
  InputButtons,
  InputEditingStateHeader,
  InputReplyStateHeader,
  MoreOptionsButton,
  openPollCreationDialog,
  SendButton,
  sendMessage,
  SendMessageDisallowedIndicator,
  setInputRef,
  showPollCreationDialog,
  ShowThreadMessageInChannelButton,
  StartAudioRecordingButton,
  StopMessageStreamingButton,
  VideoAttachmentUploadPreview,
  VideoRecorderSelectorIcon,
}: InputMessageInputContextValue & {
  /**
   * To ensure we allow re-render, when channel is changed
   */
  channelId?: string;
}) => {
  const inputMessageInputContext: InputMessageInputContextValue = useMemo(
    () => ({
      additionalTextInputProps,
      asyncMessagesLockDistance,
      asyncMessagesMinimumPressDuration,
      asyncMessagesMultiSendEnabled,
      asyncMessagesSlideToCancelDistance,
      AttachButton,
      AttachmentPickerBottomSheetHandle,
      attachmentPickerBottomSheetHandleHeight,
      attachmentPickerBottomSheetHeight,
      AttachmentPickerSelectionBar,
      attachmentSelectionBarHeight,
      AttachmentUploadPreviewList,
      AttachmentUploadProgressIndicator,
      AudioAttachmentUploadPreview,
      AudioRecorder,
      audioRecordingEnabled,
      AudioRecordingInProgress,
      AudioRecordingLockIndicator,
      AudioRecordingPreview,
      AudioRecordingWaveform,
      AutoCompleteSuggestionHeader,
      AutoCompleteSuggestionItem,
      AutoCompleteSuggestionList,
      CameraSelectorIcon,
      CommandInput,
      CommandsButton,
      compressImageQuality,
      CooldownTimer,
      CreatePollContent,
      CreatePollIcon,
      doFileUploadRequest,
      editMessage,
      FileAttachmentUploadPreview,
      FileSelectorIcon,
      handleAttachButtonPress,
      hasCameraPicker,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      ImageAttachmentUploadPreview,
      ImageSelectorIcon,
      Input,
      InputButtons,
      InputEditingStateHeader,
      InputReplyStateHeader,
      MoreOptionsButton,
      openPollCreationDialog,
      SendButton,
      sendMessage,
      SendMessageDisallowedIndicator,
      setInputRef,
      showPollCreationDialog,
      ShowThreadMessageInChannelButton,
      StartAudioRecordingButton,
      StopMessageStreamingButton,
      VideoAttachmentUploadPreview,
      VideoRecorderSelectorIcon,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compressImageQuality, channelId, CreatePollContent, showPollCreationDialog],
  );

  return inputMessageInputContext;
};
