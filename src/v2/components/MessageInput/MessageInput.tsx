import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AttachmentSelectionBar } from '../AttachmentPicker/components/AttachmentSelectionBar';
import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';
import { SuggestionsList } from '../AutoCompleteInput/SuggestionsList';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
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
import { CircleClose, CurveLineLeftUp, Edit, Lightning } from '../../icons';

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
  attachmentSelectionBar: { backgroundColor: '#F5F5F5' },
  autoCompleteInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
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
  giphyContainer: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 24,
    marginRight: 8,
    paddingHorizontal: 8,
  },
  giphyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  inputBoxContainer: {
    borderColor: '#00000029', // 29 = 16% opacity
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingRight: 10,
  },
  replyContainer: { paddingBottom: 12, paddingHorizontal: 8 },
  sendButtonContainer: { paddingBottom: 10, paddingLeft: 10 },
  suggestionsListContainer: {
    borderRadius: 10,
    elevation: 3,
    left: 8,
    position: 'absolute',
    right: 8,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.15,
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
    | 'clearReplyToMessageState'
    | 'editing'
    | 'FileUploadPreview'
    | 'fileUploads'
    | 'giphyActive'
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
    | 'replyToMessage'
    | 'resetInput'
    | 'SendButton'
    | 'sending'
    | 'sendMessageAsync'
    | 'setGiphyActive'
    | 'setShowMoreOptions'
    | 'showMoreOptions'
    | 'ShowThreadMessageInChannelButton'
    | 'removeImage'
    | 'uploadNewImage'
  > &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'Reply'> &
  Pick<
    SuggestionsContextValue<Co, Us>,
    'componentType' | 'suggestions' | 'suggestionsTitle'
  > &
  Pick<TranslationContextValue, 't'> & {
    threadList?: boolean;
  };

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
    clearReplyToMessageState,
    CommandsButton,
    componentType,
    disabled,
    editing,
    FileUploadPreview,
    fileUploads,
    giphyActive,
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
    removeImage,
    Reply,
    replyToMessage,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
    setGiphyActive,
    setShowMoreOptions,
    showMoreOptions,
    ShowThreadMessageInChannelButton,
    suggestions,
    suggestionsTitle,
    t,
    threadList,
    uploadNewImage,
    watchers,
  } = props;

  const [height, setHeight] = useState(0);

  const {
    theme: {
      colors: { grey, white },
      messageInput: {
        attachButtonContainer,
        autoCompleteInputContainer,
        commandsButtonContainer,
        composerContainer,
        container: { ...container },
        editingBoxHeader,
        editingBoxHeaderTitle,
        giphyContainer,
        giphyText,
        inputBoxContainer,
        optionsContainer,
        replyContainer,
        sendButtonContainer,
        suggestionsListContainer,
      },
    },
  } = useTheme();

  const {
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    bottomInset,
    closePicker,
    openPicker,
    selectedImages,
    selectedPicker,
    setMaxNumberOfFiles,
    setSelectedImages,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  useEffect(() => {
    setMaxNumberOfFiles(maxNumberOfFiles ?? 10);

    return () => {
      closePicker();
      setSelectedPicker(undefined);
    };
  }, [maxNumberOfFiles]);

  useEffect(() => {
    if (selectedImages.length > imageUploads.length) {
      const imagesToUpload = selectedImages.filter((selectedImage) => {
        const uploadedImage = imageUploads.find(
          (imageUpload) =>
            imageUpload.file.uri === selectedImage ||
            imageUpload.url === selectedImage,
        );
        return !uploadedImage;
      });
      imagesToUpload.forEach((image) => uploadNewImage({ uri: image }));
    } else if (selectedImages.length < imageUploads.length) {
      const imagesToRemove = imageUploads.filter(
        (imageUpload) =>
          !selectedImages.find(
            (selectedImage) =>
              selectedImage === imageUpload.file.uri ||
              selectedImage === imageUpload.url,
          ),
      );
      imagesToRemove.forEach((image) => removeImage(image.id));
    }
  }, [selectedImages.length]);

  useEffect(() => {
    if (imageUploads.length < selectedImages.length) {
      const updatedSelectedImages = selectedImages.filter((selectedImage) => {
        const uploadedImage = imageUploads.find(
          (imageUpload) =>
            imageUpload.file.uri === selectedImage ||
            imageUpload.url === selectedImage,
        );
        return uploadedImage;
      });
      setSelectedImages(updatedSelectedImages);
    } else if (imageUploads.length > selectedImages.length) {
      setSelectedImages(
        imageUploads
          .map((imageUpload) => imageUpload.url)
          .filter(Boolean) as string[],
      );
    }
  }, [imageUploads.length]);

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

  const handleOnPress = () => {
    if (selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    } else {
      if (hasImagePicker && !fileUploads.length) {
        Keyboard.dismiss();
        openPicker();
        setSelectedPicker('images');
      } else if (hasFilePicker && numberOfUploads < maxNumberOfFiles) {
        pickFile();
      }
    }
  };

  const additionalTextInputContainerProps = {
    editable: disabled ? false : undefined,
    ...additionalTextInputProps,
  };

  return (
    <>
      <View
        onLayout={({
          nativeEvent: {
            layout: { height: newHeight },
          },
        }) => setHeight(newHeight)}
        style={[styles.container, container]}
      >
        {(editing || replyToMessage) && (
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
                if (replyToMessage) {
                  clearReplyToMessageState();
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
        <View style={[styles.composerContainer, composerContainer]}>
          {Input ? (
            <Input
              additionalTextInputProps={additionalTextInputContainerProps}
              getUsers={getUsers}
              handleOnPress={handleOnPress}
            />
          ) : (
            <>
              {!giphyActive && (
                <View style={[styles.optionsContainer, optionsContainer]}>
                  {!showMoreOptions ? (
                    <MoreOptionsButton
                      handleOnPress={() => setShowMoreOptions(true)}
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
              )}
              <View
                style={[
                  styles.inputBoxContainer,
                  { paddingVertical: giphyActive ? 8 : 12 },
                  inputBoxContainer,
                ]}
              >
                {replyToMessage && (
                  <View style={[styles.replyContainer, replyContainer]}>
                    <Reply />
                  </View>
                )}
                {fileUploads.length ? <FileUploadPreview /> : null}
                {imageUploads.length ? <ImageUploadPreview /> : null}
                <View
                  style={[
                    styles.autoCompleteInputContainer,
                    {
                      paddingLeft: giphyActive ? 8 : 16,
                      paddingRight: giphyActive ? 10 : 16,
                    },
                    autoCompleteInputContainer,
                  ]}
                >
                  {giphyActive && (
                    <View style={[styles.giphyContainer, giphyContainer]}>
                      <Lightning height={16} pathFill={white} width={16} />
                      <Text style={[styles.giphyText, giphyText]}>GIPHY</Text>
                    </View>
                  )}
                  <AutoCompleteInput<At, Ch, Co, Ev, Me, Re, Us>
                    additionalTextInputProps={additionalTextInputProps}
                  />
                  {giphyActive && (
                    <TouchableOpacity
                      disabled={disabled}
                      onPress={() => {
                        setGiphyActive(false);
                      }}
                      testID='close-button'
                    >
                      <CircleClose height={20} pathFill='#7A7A7A' width={20} />
                    </TouchableOpacity>
                  )}
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
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </View>
      {componentType && suggestions ? (
        <View
          style={[
            styles.suggestionsListContainer,
            { bottom: height },
            suggestionsListContainer,
          ]}
        >
          <SuggestionsList<Co, Us>
            active={!!suggestions}
            componentType={componentType}
            suggestions={suggestions}
            suggestionsTitle={suggestionsTitle}
          />
        </View>
      ) : null}
      {selectedPicker && (
        <View
          style={[
            styles.attachmentSelectionBar,
            {
              height:
                (attachmentPickerBottomSheetHeight
                  ? attachmentPickerBottomSheetHeight +
                    (attachmentSelectionBarHeight ?? 52)
                  : 360) - (bottomInset ?? 0),
            },
          ]}
        >
          <AttachmentSelectionBar />
        </View>
      )}
    </>
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
    giphyActive: prevGiphyActive,
    imageUploads: prevImageUploads,
    isValidMessage: prevIsValidMessage,
    replyToMessage: prevReplyToMessage,
    sending: prevSending,
    showMoreOptions: prevShowMoreOptions,
    suggestions: prevSuggestions,
    suggestionsTitle: prevSuggestionsTitle,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    asyncUploads: nextAsyncUploads,
    disabled: nextDisabled,
    editing: nextEditing,
    fileUploads: nextFileUploads,
    giphyActive: nextGiphyActive,
    imageUploads: nextImageUploads,
    isValidMessage: nextIsValidMessage,
    replyToMessage: nextReplyToMessage,
    sending: nextSending,
    showMoreOptions: nextShowMoreOptions,
    suggestions: nextSuggestions,
    suggestionsTitle: nextSuggestionsTitle,
    t: nextT,
    threadList: nextThreadList,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) return false;

  const imageUploadsEqual = prevImageUploads.length === nextImageUploads.length;
  if (!imageUploadsEqual) return false;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) return false;

  const replyToMessageEqual =
    !!prevReplyToMessage &&
    !!nextReplyToMessage &&
    typeof prevReplyToMessage !== 'boolean' &&
    typeof nextReplyToMessage !== 'boolean'
      ? prevReplyToMessage.id === nextReplyToMessage.id
      : !!prevReplyToMessage === !!nextReplyToMessage;
  if (!replyToMessageEqual) return false;

  const sendingEqual = prevSending.current === nextSending.current;
  if (!sendingEqual) return false;

  const showMoreOptionsEqual = prevShowMoreOptions === nextShowMoreOptions;
  if (!showMoreOptionsEqual) return false;

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

  const suggestionsEqual =
    !!prevSuggestions?.data && !!nextSuggestions?.data
      ? prevSuggestions.data.length === nextSuggestions.data.length &&
        prevSuggestions.data.every(
          ({ name }, index) => name === nextSuggestions.data[index].name,
        )
      : !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) return false;

  const suggestionsTitleEqual = prevSuggestionsTitle === nextSuggestionsTitle;
  if (!suggestionsTitleEqual) return false;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) return false;

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
    clearReplyToMessageState,
    CommandsButton,
    editing,
    FileUploadPreview,
    fileUploads,
    giphyActive,
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
    removeImage,
    replyToMessage,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
    setGiphyActive,
    setShowMoreOptions,
    showMoreOptions,
    ShowThreadMessageInChannelButton,
    uploadNewImage,
  } = useMessageInputContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { Reply } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    componentType,
    suggestions,
    suggestionsTitle,
  } = useSuggestionsContext<Co, Us>();

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
        clearReplyToMessageState,
        CommandsButton,
        componentType,
        disabled,
        editing,
        FileUploadPreview,
        fileUploads,
        giphyActive,
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
        removeImage,
        Reply,
        replyToMessage,
        resetInput,
        SendButton,
        sending,
        sendMessageAsync,
        setGiphyActive,
        setShowMoreOptions,
        showMoreOptions,
        ShowThreadMessageInChannelButton,
        suggestions,
        suggestionsTitle,
        t,
        uploadNewImage,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
