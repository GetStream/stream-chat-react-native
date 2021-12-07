import { useMemo } from 'react';

import type { InputMessageInputContextValue } from '../../../contexts/messageInputContext/MessageInputContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreateInputMessageInputContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
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
}: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us> & {
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

  const inputMessageInputContext: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us> =
    useMemo(
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
