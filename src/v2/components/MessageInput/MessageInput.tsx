import React, { useEffect } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { CircleClose } from '../../icons/CircleClose';
import { CurveLineLeftUp } from '../../icons/CurveLineLeftUp';
import { Edit } from '../../icons/Edit';

import type { UserResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  attachButtonContainer: { paddingRight: 10 },
  autoCompleteInputContainer: { paddingHorizontal: 16 },
  composerContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  container: {
    borderColor: '#00000029', // 29 = 16% opacity
    borderTopWidth: 1,
    padding: 10,
  },
  editingBoxHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  editingBoxHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputBoxContainer: {
    borderColor: '#00000029', // 29 = 16% opacity
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingRight: 10,
  },
  replyContainer: { paddingBottom: 12, paddingHorizontal: 8 },
  sendButtonContainer: { paddingBottom: 10, paddingLeft: 10 },
});

type MessageInputPropsWithContext<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'disabled' | 'members' | 'watchers'
> &
  Pick<
    MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'additionalTextInputProps'
    | 'appendText'
    | 'asyncIds'
    | 'asyncUploads'
    | 'AttachButton'
    | 'CommandsButton'
    | 'clearEditingState'
    | 'clearReplyToState'
    | 'editing'
    | 'FileUploadPreview'
    | 'fileUploads'
    | 'focused'
    | 'hasFilePicker'
    | 'hasImagePicker'
    | 'ImageUploadPreview'
    | 'imageUploads'
    | 'Input'
    | 'inputBoxRef'
    | 'isValidMessage'
    | 'maxNumberOfFiles'
    | 'MoreOptionsButton'
    | 'numberOfUploads'
    | 'pickFile'
    | 'pickImage'
    | 'replyTo'
    | 'resetInput'
    | 'SendButton'
    | 'sending'
    | 'sendMessageAsync'
  > &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'Reply'> &
  Pick<SuggestionsContextValue<Co, Us>, 'setInputBoxContainerRef'> &
  Pick<TranslationContextValue, 't'>;

export const MessageInputWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalTextInputProps,
    appendText,
    asyncIds,
    asyncUploads,
    AttachButton,
    clearEditingState,
    clearReplyToState,
    CommandsButton,
    disabled,
    editing,
    FileUploadPreview,
    fileUploads,
    focused,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    isValidMessage,
    maxNumberOfFiles,
    members,
    MoreOptionsButton,
    numberOfUploads,
    pickFile,
    pickImage,
    Reply,
    replyTo,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
    setInputBoxContainerRef,
    t,
    watchers,
  } = props;

  const {
    theme: {
      colors: { grey },
      messageInput: {
        attachButtonContainer,
        autoCompleteInputContainer,
        commandsButtonContainer,
        composerContainer,
        container: { ...container },
        editingBoxHeader,
        editingBoxHeaderTitle,
        inputBoxContainer,
        optionsContainer,
        replyContainer,
        sendButtonContainer,
      },
    },
  } = useTheme();

  useEffect(() => {
    if (editing && inputBoxRef.current) {
      inputBoxRef.current.focus();
    }

    if (!editing) {
      resetInput();
    }
  }, [editing]);

  useEffect(() => {
    if (Object.keys(asyncUploads).length) {
      /**
       * When successful image upload response occurs after hitting send,
       * send a follow up message with the image
       */
      sending.current = true;
      asyncIds.forEach((id) => sendMessageAsync(id));
      sending.current = false;
    }
  }, [asyncIds, asyncUploads, sending, sendMessageAsync]);

  const getMembers = () => {
    const result: UserResponse<Us>[] = [];
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) =>
        result.push(member.user as UserResponse<Us>),
      );
    }

    return result;
  };

  const getUsers = () => {
    const users = [...getMembers(), ...getWatchers()];

    // make sure we don't list users twice
    const uniqueUsers: { [key: string]: UserResponse<Us> } = {};
    for (const user of users) {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user as UserResponse<Us>;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  const getWatchers = () => {
    const result: UserResponse<Us>[] = [];
    if (watchers && Object.values(watchers).length) {
      result.push(...(Object.values(watchers) as UserResponse<Us>[]));
    }

    return result;
  };

  const handleOnPress = async () => {
    if (numberOfUploads >= maxNumberOfFiles) {
      return;
    }

    if (hasImagePicker) {
      if (hasFilePicker) {
        await Keyboard.dismiss();
        pickFile();
      } else {
        pickImage();
      }
    } else if (hasFilePicker) {
      pickFile();
    }
  };

  const additionalTextInputContainerProps = {
    editable: disabled ? false : undefined,
    ...additionalTextInputProps,
  };

  return (
    <View style={[styles.container, container]}>
      {(editing || replyTo) && (
        <View style={[styles.editingBoxHeader, editingBoxHeader]}>
          {editing ? (
            <Edit pathFill={grey} />
          ) : (
            <CurveLineLeftUp pathFill={grey} />
          )}
          <Text style={[styles.editingBoxHeaderTitle, editingBoxHeaderTitle]}>
            {editing ? t('Editing Message') : t('Reply to Message')}
          </Text>
          <TouchableOpacity
            disabled={disabled}
            onPress={() => {
              resetInput();
              if (editing) {
                clearEditingState();
              }
              if (replyTo) {
                clearReplyToState();
              }
              if (inputBoxRef.current) {
                inputBoxRef.current.blur();
              }
            }}
            testID='close-button'
          >
            <CircleClose pathFill='#7A7A7A' />
          </TouchableOpacity>
        </View>
      )}
      <View
        ref={setInputBoxContainerRef}
        style={[styles.composerContainer, composerContainer]}
      >
        {Input ? (
          <Input
            additionalTextInputProps={additionalTextInputContainerProps}
            getUsers={getUsers}
            handleOnPress={handleOnPress}
          />
        ) : (
          <>
            <View style={[styles.optionsContainer, optionsContainer]}>
              {focused ? (
                <MoreOptionsButton
                  handleOnPress={() => {
                    if (inputBoxRef.current) {
                      inputBoxRef.current.blur();
                    }
                  }}
                />
              ) : (
                <>
                  {(hasImagePicker || hasFilePicker) && (
                    <View
                      style={[
                        styles.attachButtonContainer,
                        attachButtonContainer,
                      ]}
                    >
                      <AttachButton handleOnPress={handleOnPress} />
                    </View>
                  )}
                  <View style={[commandsButtonContainer]}>
                    <CommandsButton
                      handleOnPress={() => {
                        appendText('/');
                        if (inputBoxRef.current) {
                          inputBoxRef.current.focus();
                        }
                      }}
                    />
                  </View>
                </>
              )}
            </View>
            <View style={[styles.inputBoxContainer, inputBoxContainer]}>
              {replyTo && (
                <View style={[styles.replyContainer, replyContainer]}>
                  <Reply />
                </View>
              )}
              {fileUploads.length ? <FileUploadPreview /> : null}
              {imageUploads.length ? <ImageUploadPreview /> : null}
              <View
                style={[
                  styles.autoCompleteInputContainer,
                  autoCompleteInputContainer,
                ]}
              >
                <AutoCompleteInput<At, Ch, Co, Ev, Me, Re, Us>
                  additionalTextInputProps={additionalTextInputProps}
                />
              </View>
            </View>
            <View style={[styles.sendButtonContainer, sendButtonContainer]}>
              <SendButton
                disabled={disabled || sending.current || !isValidMessage()}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    asyncUploads: prevAsyncUploads,
    disabled: prevDisabled,
    editing: prevEditing,
    fileUploads: prevFileUploads,
    focused: prevFocused,
    imageUploads: prevImageUploads,
    isValidMessage: prevIsValidMessage,
    replyTo: prevReplyTo,
    sending: prevSending,
    t: prevT,
  } = prevProps;
  const {
    asyncUploads: nextAsyncUploads,
    disabled: nextDisabled,
    editing: nextEditing,
    fileUploads: nextFileUploads,
    focused: nextFocused,
    imageUploads: nextImageUploads,
    isValidMessage: nextIsValidMessage,
    replyTo: nextReplyTo,
    sending: nextSending,
    t: nextT,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) return false;

  const replyToEqual = !!prevReplyTo === !!nextReplyTo;
  if (!replyToEqual) return false;

  const focusedEqual = prevFocused === nextFocused;
  if (!focusedEqual) return false;

  const sendingEqual = prevSending.current === nextSending.current;
  if (!sendingEqual) return false;

  const isValidMessageEqual = prevIsValidMessage() === nextIsValidMessage();
  if (!isValidMessageEqual) return false;

  const asyncUploadsEqual = Object.keys(prevAsyncUploads).every(
    (key) =>
      prevAsyncUploads[key].state === nextAsyncUploads[key].state &&
      prevAsyncUploads[key].url === nextAsyncUploads[key].url,
  );
  if (!asyncUploadsEqual) return false;

  const fileUploadsEqual = prevFileUploads.length === nextFileUploads.length;
  if (!fileUploadsEqual) return false;

  const imageUploadsEqual = prevImageUploads.length === nextImageUploads.length;
  if (!imageUploadsEqual) return false;

  return true;
};

const MemoizedMessageInput = React.memo(
  MessageInputWithContext,
  areEqual,
) as typeof MessageInputWithContext;

export type MessageInputProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<MessageInputPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * UI Component for message input
 * It's a consumer of
 * [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext),
 * [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext),
 * [MessageInput Context](https://getstream.github.io/stream-chat-react-native/#messageinputcontext),
 * [Suggestions Context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext), and
 * [Translation Context](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 *
 * @example ./MessageInput.md
 */
export const MessageInput = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { disabled = false, members, watchers } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const {
    additionalTextInputProps,
    appendText,
    asyncIds,
    asyncUploads,
    AttachButton,
    clearEditingState,
    clearReplyToState,
    CommandsButton,
    editing,
    FileUploadPreview,
    fileUploads,
    focused,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    isValidMessage,
    maxNumberOfFiles,
    MoreOptionsButton,
    numberOfUploads,
    pickFile,
    pickImage,
    replyTo,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { Reply } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { setInputBoxContainerRef } = useSuggestionsContext<Co, Us>();

  const { t } = useTranslationContext();

  return (
    <MemoizedMessageInput
      {...{
        additionalTextInputProps,
        appendText,
        asyncIds,
        asyncUploads,
        AttachButton,
        clearEditingState,
        clearReplyToState,
        CommandsButton,
        disabled,
        editing,
        FileUploadPreview,
        fileUploads,
        focused,
        hasFilePicker,
        hasImagePicker,
        ImageUploadPreview,
        imageUploads,
        Input,
        inputBoxRef,
        isValidMessage,
        maxNumberOfFiles,
        members,
        MoreOptionsButton,
        numberOfUploads,
        pickFile,
        pickImage,
        Reply,
        replyTo,
        resetInput,
        SendButton,
        sending,
        sendMessageAsync,
        setInputBoxContainerRef,
        t,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
