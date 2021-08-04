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
  MoreOptionsButton,
  numberOfLines,
  onChangeText,
  quotedMessage,
  SendButton,
  sendImageAsync,
  sendMessage,
  setInputRef,
  setQuotedMessageState,
  ShowThreadMessageInChannelButton,
  UploadProgressIndicator,
  uploadsEnabled,
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
        MoreOptionsButton,
        numberOfLines,
        onChangeText,
        quotedMessage,
        SendButton,
        sendImageAsync,
        sendMessage,
        setInputRef,
        setQuotedMessageState,
        ShowThreadMessageInChannelButton,
        UploadProgressIndicator,
        uploadsEnabled,
      }),
      [
        compressImageQuality,
        channelId,
        editingExists,
        initialValue,
        maxMessageLength,
        quotedMessageId,
        uploadsEnabled,
      ],
    );

  return inputMessageInputContext;
};
