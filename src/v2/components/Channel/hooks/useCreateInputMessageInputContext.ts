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
  clearEditingState,
  clearReplyToMessageState,
  CommandsButton,
  compressImageQuality,
  doDocUploadRequest,
  doImageUploadRequest,
  editing,
  editMessage,
  FileUploadPreview,
  hasFilePicker,
  hasImagePicker,
  ImageUploadPreview,
  initialValue,
  Input,
  maxNumberOfFiles,
  MoreOptionsButton,
  numberOfLines,
  onChangeText,
  replyToMessage,
  SendButton,
  sendImageAsync,
  sendMessage,
  setInputRef,
  ShowThreadMessageInChannelButton,
  UploadProgressIndicator,
}: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const editingExists = !!editing;
  const replyToMessageId = replyToMessage
    ? typeof replyToMessage === 'boolean'
      ? ''
      : replyToMessage.id
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
      clearEditingState,
      clearReplyToMessageState,
      CommandsButton,
      compressImageQuality,
      doDocUploadRequest,
      doImageUploadRequest,
      editing,
      editMessage,
      FileUploadPreview,
      hasFilePicker,
      hasImagePicker,
      ImageUploadPreview,
      initialValue,
      Input,
      maxNumberOfFiles,
      MoreOptionsButton,
      numberOfLines,
      onChangeText,
      replyToMessage,
      SendButton,
      sendImageAsync,
      sendMessage,
      setInputRef,
      ShowThreadMessageInChannelButton,
      UploadProgressIndicator,
    }),
    [compressImageQuality, editingExists, initialValue, replyToMessageId],
  );

  return inputMessageInputContext;
};
