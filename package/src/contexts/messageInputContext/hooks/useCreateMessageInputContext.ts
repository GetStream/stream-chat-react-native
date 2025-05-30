import { useMemo } from 'react';

import type { ThreadContextValue } from '../../threadContext/ThreadContext';
import type { MessageInputContextValue } from '../MessageInputContext';

export const useCreateMessageInputContext = ({
  additionalTextInputProps,
  appendText,
  asyncIds,
  asyncMessagesLockDistance,
  asyncMessagesMinimumPressDuration,
  asyncMessagesMultiSendEnabled,
  asyncMessagesSlideToCancelDistance,
  asyncUploads,
  AttachButton,
  AudioAttachmentUploadPreview,
  AudioRecorder,
  audioRecordingEnabled,
  AudioRecordingInProgress,
  AudioRecordingLockIndicator,
  AudioRecordingPreview,
  AudioRecordingWaveform,
  autoCompleteSuggestionsLimit,
  clearEditingState,
  clearQuotedMessageState,
  closeAttachmentPicker,
  closePollCreationDialog,
  CommandsButton,
  compressImageQuality,
  cooldownEndsAt,
  CooldownTimer,
  CreatePollContent,
  doDocUploadRequest,
  doImageUploadRequest,
  editing,
  editMessage,
  emojiSearchIndex,
  FileUploadPreview,
  fileUploads,
  giphyActive,
  giphyEnabled,
  handleAttachButtonPress,
  hasCameraPicker,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  hasText,
  ImageUploadPreview,
  imageUploads,
  initialValue,
  Input,
  inputBoxRef,
  InputButtons,
  InputEditingStateHeader,
  InputGiphySearch,
  InputReplyStateHeader,
  isValidMessage,
  maxMessageLength,
  maxNumberOfFiles,
  mentionAllAppUsersEnabled,
  mentionAllAppUsersQuery,
  mentionedUsers,
  MoreOptionsButton,
  numberOfLines,
  numberOfUploads,
  onChange,
  onChangeText,
  onSelectItem,
  openAttachmentPicker,
  openCommandsPicker,
  openFilePicker,
  openMentionsPicker,
  openPollCreationDialog,
  pickAndUploadImageFromNativePicker,
  pickFile,
  quotedMessage,
  removeFile,
  removeImage,
  resetInput,
  selectedPicker,
  SendButton,
  sendImageAsync,
  sending,
  sendMessage,
  sendMessageAsync,
  SendMessageDisallowedIndicator,
  sendThreadMessageInChannel,
  setAsyncIds,
  setAsyncUploads,
  setFileUploads,
  setGiphyActive,
  setImageUploads,
  setInputBoxRef,
  setInputRef,
  setMentionedUsers,
  setNumberOfUploads,
  setQuotedMessageState,
  setSendThreadMessageInChannel,
  setShowMoreOptions,
  setText,
  showMoreOptions,
  showPollCreationDialog,
  ShowThreadMessageInChannelButton,
  StartAudioRecordingButton,
  StopMessageStreamingButton,
  takeAndUploadImage,
  text,
  thread,
  toggleAttachmentPicker,
  triggerSettings,
  updateMessage,
  uploadFile,
  uploadImage,
  uploadNewFile,
  uploadNewImage,
  UploadProgressIndicator,
}: MessageInputContextValue & Pick<ThreadContextValue, 'thread'>) => {
  const editingdep = editing?.id;
  const fileUploadsValue = fileUploads.map(({ state }) => state).join();
  const imageUploadsValue = imageUploads.map(({ state }) => state).join();
  const asyncUploadsValue = Object.keys(asyncUploads).join();
  const mentionedUsersLength = mentionedUsers.length;
  const quotedMessageId = quotedMessage ? quotedMessage.id : '';
  const threadId = thread?.id;
  const asyncIdsLength = asyncIds.length;

  const messageInputContext: MessageInputContextValue = useMemo(
    () => ({
      additionalTextInputProps,
      appendText,
      asyncIds,
      asyncMessagesLockDistance,
      asyncMessagesMinimumPressDuration,
      asyncMessagesMultiSendEnabled,
      asyncMessagesSlideToCancelDistance,
      asyncUploads,
      AttachButton,
      AudioAttachmentUploadPreview,
      AudioRecorder,
      audioRecordingEnabled,
      AudioRecordingInProgress,
      AudioRecordingLockIndicator,
      AudioRecordingPreview,
      AudioRecordingWaveform,
      autoCompleteSuggestionsLimit,
      clearEditingState,
      clearQuotedMessageState,
      closeAttachmentPicker,
      closePollCreationDialog,
      CommandsButton,
      compressImageQuality,
      cooldownEndsAt,
      CooldownTimer,
      CreatePollContent,
      doDocUploadRequest,
      doImageUploadRequest,
      editing,
      editMessage,
      emojiSearchIndex,
      FileUploadPreview,
      fileUploads,
      giphyActive,
      giphyEnabled,
      handleAttachButtonPress,
      hasCameraPicker,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      hasText,
      ImageUploadPreview,
      imageUploads,
      initialValue,
      Input,
      inputBoxRef,
      InputButtons,
      InputEditingStateHeader,
      InputGiphySearch,
      InputReplyStateHeader,
      isValidMessage,
      maxMessageLength,
      maxNumberOfFiles,
      mentionAllAppUsersEnabled,
      mentionAllAppUsersQuery,
      mentionedUsers,
      MoreOptionsButton,
      numberOfLines,
      numberOfUploads,
      onChange,
      onChangeText,
      onSelectItem,
      openAttachmentPicker,
      openCommandsPicker,
      openFilePicker,
      openMentionsPicker,
      openPollCreationDialog,
      pickAndUploadImageFromNativePicker,
      pickFile,
      quotedMessage,
      removeFile,
      removeImage,
      resetInput,
      selectedPicker,
      SendButton,
      sendImageAsync,
      sending,
      sendMessage,
      sendMessageAsync,
      SendMessageDisallowedIndicator,
      sendThreadMessageInChannel,
      setAsyncIds,
      setAsyncUploads,
      setFileUploads,
      setGiphyActive,
      setImageUploads,
      setInputBoxRef,
      setInputRef,
      setMentionedUsers,
      setNumberOfUploads,
      setQuotedMessageState,
      setSendThreadMessageInChannel,
      setShowMoreOptions,
      setText,
      showMoreOptions,
      showPollCreationDialog,
      ShowThreadMessageInChannelButton,
      StartAudioRecordingButton,
      StopMessageStreamingButton,
      takeAndUploadImage,
      text,
      toggleAttachmentPicker,
      triggerSettings,
      updateMessage,
      uploadFile,
      uploadImage,
      uploadNewFile,
      uploadNewImage,
      UploadProgressIndicator,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncIdsLength,
      asyncUploadsValue,
      cooldownEndsAt,
      editingdep,
      fileUploadsValue,
      giphyActive,
      giphyEnabled,
      hasText,
      imageUploadsValue,
      maxMessageLength,
      mentionedUsersLength,
      quotedMessageId,
      selectedPicker,
      sendThreadMessageInChannel,
      showMoreOptions,
      text,
      threadId,
      showPollCreationDialog,
      onChange,
    ],
  );

  return messageInputContext;
};
