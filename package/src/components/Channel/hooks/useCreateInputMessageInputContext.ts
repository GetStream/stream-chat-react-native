import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateInputMessageInputContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
  disabled,
  doDocUploadRequest,
  doImageUploadRequest,
  editing,
  editMessage,
  emojiSearchIndex,
  FileUploadPreview,
  hasCommands,
  hasFilePicker,
  hasImagePicker,
  ImageUploadPreview,
  initialValue,
  Input,
  InputButtons,
  InputEditingStateHeader,
  InputGiphySearch,
  InputReplyStateHeader,
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
}: InputMessageInputContextValue<StreamChatGenerics> & {
  /**
   * To ensure we allow re-render, when channel is changed
   */
  channelId?: string;
}) => {
  const editingDep = typeof editing === 'boolean' ? editing : editing?.id;
  const quotedMessageId = quotedMessage
    ? typeof quotedMessage === 'boolean'
      ? ''
      : quotedMessage.id
    : '';

  const inputMessageInputContext: InputMessageInputContextValue<StreamChatGenerics> = useMemo(
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
      disabled,
      doDocUploadRequest,
      doImageUploadRequest,
      editing,
      editMessage,
      emojiSearchIndex,
      FileUploadPreview,
      hasCommands,
      hasFilePicker,
      hasImagePicker,
      ImageUploadPreview,
      initialValue,
      Input,
      InputButtons,
      InputEditingStateHeader,
      InputGiphySearch,
      InputReplyStateHeader,
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
      disabled,
      editingDep,
      initialValue,
      maxMessageLength,
      quotedMessageId,
    ],
  );

  return inputMessageInputContext;
};
