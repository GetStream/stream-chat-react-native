import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateInputMessageInputContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalTextInputProps,
  AttachButton,
  autoCompleteSuggestionsLimit,
  autoCompleteTriggerSettings,
  channelId,
  clearEditingState,
  clearQuotedMessageState,
  CommandsButton,
  compressImageQuality,
  CooldownTimer,
  doDocUploadRequest,
  doImageUploadRequest,
  editing,
  editMessage,
  FileUploadPreview,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  ImageUploadPreview,
  initialValue,
  Input,
  InputButtons,
  maxMessageLength,
  maxNumberOfFiles,
  mentionAllAppUsersEnabled,
  mentionAllAppUsersQuery,
  MoreOptionsButton,
  numberOfLines,
  onChangeText,
  quotedMessage,
  SendButton,
  sendImageAsync,
  sendMessage,
  SendMessageDisallowedIndicator,
  setInputRef,
  setQuotedMessageState,
  ShowThreadMessageInChannelButton,
  UploadProgressIndicator,
}: InputMessageInputContextValue<StreamChatClient> & {
  /**
   * To ensure we allow re-render, when channel is changed
   */
  channelId?: string;
}) => {
  const editingExists = !!editing;
  const quotedMessageId = quotedMessage
    ? typeof quotedMessage === 'boolean'
      ? ''
      : quotedMessage.id
    : '';

  const inputMessageInputContext: InputMessageInputContextValue<StreamChatClient> = useMemo(
    () => ({
      additionalTextInputProps,
      AttachButton,
      autoCompleteSuggestionsLimit,
      autoCompleteTriggerSettings,
      clearEditingState,
      clearQuotedMessageState,
      CommandsButton,
      compressImageQuality,
      CooldownTimer,
      doDocUploadRequest,
      doImageUploadRequest,
      editing,
      editMessage,
      FileUploadPreview,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      ImageUploadPreview,
      initialValue,
      Input,
      InputButtons,
      maxMessageLength,
      maxNumberOfFiles,
      mentionAllAppUsersEnabled,
      mentionAllAppUsersQuery,
      MoreOptionsButton,
      numberOfLines,
      onChangeText,
      quotedMessage,
      SendButton,
      sendImageAsync,
      sendMessage,
      SendMessageDisallowedIndicator,
      setInputRef,
      setQuotedMessageState,
      ShowThreadMessageInChannelButton,
      UploadProgressIndicator,
    }),
    [
      compressImageQuality,
      channelId,
      editingExists,
      initialValue,
      maxMessageLength,
      quotedMessageId,
    ],
  );

  return inputMessageInputContext;
};
