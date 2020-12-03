import React, { useEffect } from 'react';
import {
  ImageRequireSource,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';
import { IconSquare } from '../IconSquare';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

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

const iconClose: ImageRequireSource = require('../../../images/icons/icon_close.png');

const styles = StyleSheet.create({
  composerContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginVertical: 4,
    minHeight: 46,
    paddingHorizontal: 10,
  },
  container: {
    borderColor: '#00000014',
    borderTopWidth: 1,
  },
  editingBoxContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#808080',
    shadowOpacity: 0.5,
    zIndex: 100,
  },
  editingBoxHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  editingBoxHeaderTitle: {
    fontWeight: 'bold',
  },
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
    | 'editing'
    | 'FileUploadPreview'
    | 'fileUploads'
    | 'hasFilePicker'
    | 'hasImagePicker'
    | 'ImageUploadPreview'
    | 'imageUploads'
    | 'Input'
    | 'inputBoxRef'
    | 'isValidMessage'
    | 'maxNumberOfFiles'
    | 'numberOfUploads'
    | 'pickFile'
    | 'pickImage'
    | 'resetInput'
    | 'SendButton'
    | 'sending'
    | 'sendMessageAsync'
  > &
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
    CommandsButton,
    disabled,
    editing,
    FileUploadPreview,
    fileUploads,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    isValidMessage,
    maxNumberOfFiles,
    members,
    numberOfUploads,
    pickFile,
    pickImage,
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
      messageInput: {
        composerContainer,
        container: { conditionalPadding, ...container },
        editingBoxContainer,
        editingBoxHeader,
        editingBoxHeaderTitle,
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
        // if (attachActionSheet?.current) {
        //   attachActionSheet.current.show();
        // }
      } else {
        pickImage();
      }
    } else if (hasFilePicker) {
      pickFile();
    }
  };

  const renderInputContainer = () => {
    const additionalTextInputContainerProps = {
      editable: disabled ? false : undefined,
      ...additionalTextInputProps,
    };

    return (
      <View
        style={[
          styles.container,
          { paddingTop: imageUploads.length ? conditionalPadding : 0 },
          container,
        ]}
      >
        {fileUploads && <FileUploadPreview />}
        {imageUploads && <ImageUploadPreview />}

        {/**
         * TODO: Use custom action sheet to show icon with titles of button. But it doesn't
         * work well with async onPress operations. So find a solution.
         */}
        {/* <ActionSheetAttachment
          closeAttachActionSheet={closeAttachActionSheet}
          pickFile={pickFile}
          pickImage={pickImage}
          setAttachActionSheetRef={setAttachActionSheetRef}
          styles={actionSheetStyles}
        /> */}
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
              {(hasImagePicker || hasFilePicker) && (
                <AttachButton handleOnPress={handleOnPress} />
              )}
              <CommandsButton
                handleOnPress={() => {
                  appendText('/');
                }}
              />
              <AutoCompleteInput<At, Ch, Co, Ev, Me, Re, Us>
                additionalTextInputProps={additionalTextInputProps}
              />
              <SendButton
                disabled={disabled || sending.current || !isValidMessage()}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  return editing ? (
    <View
      style={[styles.editingBoxContainer, editingBoxContainer]}
      testID='editing'
    >
      <View style={[styles.editingBoxHeader, editingBoxHeader]}>
        <Text style={[styles.editingBoxHeaderTitle, editingBoxHeaderTitle]}>
          {t('Editing Message')}
        </Text>
        <IconSquare
          icon={iconClose}
          onPress={() => {
            resetInput();
            clearEditingState();
          }}
        />
      </View>
      {renderInputContainer()}
    </View>
  ) : (
    renderInputContainer()
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
    isValidMessage: prevIsValidMessage,
    sending: prevSending,
    t: prevT,
  } = prevProps;
  const {
    asyncUploads: nextAsyncUploads,
    disabled: nextDisabled,
    editing: nextEditing,
    isValidMessage: nextIsValidMessage,
    sending: nextSending,
    t: nextT,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const editingEqual = prevEditing === nextEditing;
  if (!editingEqual) return false;

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
 * [Messages Context](https://getstream.github.io/stream-chat-react-native/#messagescontext),
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
    CommandsButton,
    editing,
    FileUploadPreview,
    fileUploads,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    isValidMessage,
    maxNumberOfFiles,
    numberOfUploads,
    pickFile,
    pickImage,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

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
        CommandsButton,
        disabled,
        editing,
        FileUploadPreview,
        fileUploads,
        hasFilePicker,
        hasImagePicker,
        ImageUploadPreview,
        imageUploads,
        Input,
        inputBoxRef,
        isValidMessage,
        maxNumberOfFiles,
        members,
        numberOfUploads,
        pickFile,
        pickImage,
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
