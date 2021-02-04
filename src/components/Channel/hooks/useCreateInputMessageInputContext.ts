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
  Us extends UnknownType = DefaultUserType
>({
  additionalTextInputProps,
  AttachButton,
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
  ShowThreadMessageInChannelButton,
  UploadProgressIndicator,
  uploadsEnabled,
}: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const editingExists = !!editing;
  const quotedMessageId = quotedMessage
    ? typeof quotedMessage === 'boolean'
      ? ''
      : quotedMessage.id
    : '';

  const inputMessageInputContext: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  > = useMemo(
    () => ({
      additionalTextInputProps,
      AttachButton,
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
      ShowThreadMessageInChannelButton,
      UploadProgressIndicator,
      uploadsEnabled,
    }),
    [
      compressImageQuality,
      editingExists,
      initialValue,
      maxMessageLength,
      quotedMessageId,
      uploadsEnabled,
    ],
  );

  return inputMessageInputContext;
};
