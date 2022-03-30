import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { UserResponse } from 'stream-chat';

import { useCountdown } from './hooks/useCountdown';

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
import { useOwnCapabilitiesContext } from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import {
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { Asset, DefaultStreamChatGenerics } from '../../types/types';
import { AttachmentSelectionBar } from '../AttachmentPicker/components/AttachmentSelectionBar';
import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';

const styles = StyleSheet.create({
  attachmentSeparator: {
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  autoCompleteInputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 16,
  },
  composerContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  container: {
    borderTopWidth: 1,
    padding: 10,
  },
  inputBoxContainer: {
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled' | 'members' | 'watchers'> &
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    | 'additionalTextInputProps'
    | 'asyncIds'
    | 'asyncUploads'
    | 'cooldownEndsAt'
    | 'CooldownTimer'
    | 'clearEditingState'
    | 'clearQuotedMessageState'
    | 'closeAttachmentPicker'
    | 'editing'
    | 'FileUploadPreview'
    | 'fileUploads'
    | 'giphyActive'
    | 'ImageUploadPreview'
    | 'imageUploads'
    | 'Input'
    | 'inputBoxRef'
    | 'InputButtons'
    | 'InputEditingStateHeader'
    | 'InputGiphySearch'
    | 'InputReplyStateHeader'
    | 'isValidMessage'
    | 'maxNumberOfFiles'
    | 'mentionedUsers'
    | 'numberOfUploads'
    | 'quotedMessage'
    | 'resetInput'
    | 'SendButton'
    | 'sending'
    | 'sendMessageAsync'
    | 'setShowMoreOptions'
    | 'setGiphyActive'
    | 'showMoreOptions'
    | 'ShowThreadMessageInChannelButton'
    | 'removeFile'
    | 'removeImage'
    | 'uploadNewFile'
    | 'uploadNewImage'
  > &
  Pick<MessagesContextValue<StreamChatGenerics>, 'Reply'> &
  Pick<
    SuggestionsContextValue<StreamChatGenerics>,
    | 'AutoCompleteSuggestionHeader'
    | 'AutoCompleteSuggestionItem'
    | 'AutoCompleteSuggestionList'
    | 'suggestions'
    | 'triggerType'
  > &
  Pick<ThreadContextValue<StreamChatGenerics>, 'thread'> &
  Pick<TranslationContextValue, 't'> & {
    threadList?: boolean;
  };

const MessageInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageInputPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTextInputProps,
    asyncIds,
    asyncUploads,
    AutoCompleteSuggestionList,
    closeAttachmentPicker,
    cooldownEndsAt,
    CooldownTimer,
    disabled,
    editing,
    FileUploadPreview,
    fileUploads,
    giphyActive,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    InputGiphySearch,
    InputReplyStateHeader,
    isValidMessage,
    maxNumberOfFiles,
    members,
    mentionedUsers,
    numberOfUploads,
    quotedMessage,
    removeFile,
    removeImage,
    Reply,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
    ShowThreadMessageInChannelButton,
    suggestions,
    thread,
    threadList,
    triggerType,
    uploadNewFile,
    uploadNewImage,
    watchers,
  } = props;

  const [height, setHeight] = useState(0);

  const {
    theme: {
      colors: { border, grey_whisper, white, white_smoke },
      messageInput: {
        attachmentSelectionBar,
        autoCompleteInputContainer,
        composerContainer,
        container,
        inputBoxContainer,
        optionsContainer,
        replyContainer,
        sendButtonContainer,
        suggestionsListContainer: { container: suggestionListContainer },
      },
    },
  } = useTheme();

  const {
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    bottomInset,
    selectedFiles,
    selectedImages,
    selectedPicker,
    setMaxNumberOfFiles,
    setSelectedFiles,
    setSelectedImages,
  } = useAttachmentPickerContext();

  const { seconds: cooldownRemainingSeconds } = useCountdown(cooldownEndsAt);

  /**
   * Mounting and un-mounting logic are un-related in following useEffect.
   * While mounting we want to pass maxNumberOfFiles (which is prop on Channel component)
   * to AttachmentPicker (on OverlayProvider)
   *
   * While un-mounting, we want to close the picker e.g., while navigating away.
   */
  useEffect(() => {
    setMaxNumberOfFiles(maxNumberOfFiles ?? 10);

    return closeAttachmentPicker;
  }, []);

  const [hasResetImages, setHasResetImages] = useState(false);
  const [hasResetFiles, setHasResetFiles] = useState(false);
  const selectedImagesLength = hasResetImages ? selectedImages.length : 0;
  const imageUploadsLength = hasResetImages ? imageUploads.length : 0;
  const selectedFilesLength = hasResetFiles ? selectedFiles.length : 0;
  const fileUploadsLength = hasResetFiles ? fileUploads.length : 0;
  const imagesForInput = (!!thread && !!threadList) || (!thread && !threadList);

  useEffect(() => {
    setSelectedImages([]);
    if (imageUploads.length) {
      imageUploads.forEach((image) => removeImage(image.id));
    }
    return () => setSelectedImages([]);
  }, []);

  useEffect(() => {
    setSelectedFiles([]);
    if (fileUploads.length) {
      fileUploads.forEach((file) => removeFile(file.id));
    }
    return () => setSelectedFiles([]);
  }, []);

  useEffect(() => {
    if (hasResetImages === false && imageUploadsLength === 0 && selectedImagesLength === 0) {
      setHasResetImages(true);
    }
  }, [imageUploadsLength, selectedImagesLength]);

  useEffect(() => {
    if (hasResetFiles === false && fileUploadsLength === 0 && selectedFilesLength === 0) {
      setHasResetFiles(true);
    }
  }, [fileUploadsLength, selectedFilesLength]);

  useEffect(() => {
    if (imagesForInput === false && imageUploads.length) {
      imageUploads.forEach((image) => removeImage(image.id));
    }
  }, [imagesForInput]);

  useEffect(() => {
    if (imagesForInput) {
      if (selectedImagesLength > imageUploadsLength) {
        /** User selected an image in bottom sheet attachment picker */
        const imagesToUpload = selectedImages.filter((selectedImage) => {
          const uploadedImage = imageUploads.find(
            (imageUpload) =>
              imageUpload.file.uri === selectedImage.uri || imageUpload.url === selectedImage.uri,
          );
          return !uploadedImage;
        });
        imagesToUpload.forEach((image) => uploadNewImage(image));
      } else {
        /** User de-selected an image in bottom sheet attachment picker */
        const imagesToRemove = imageUploads.filter(
          (imageUpload) =>
            !selectedImages.find(
              (selectedImage) =>
                selectedImage.uri === imageUpload.file.uri || selectedImage.uri === imageUpload.url,
            ),
        );
        imagesToRemove.forEach((image) => removeImage(image.id));
      }
    }
  }, [selectedImagesLength]);

  useEffect(() => {
    if (selectedFilesLength > fileUploadsLength) {
      /** User selected a video in bottom sheet attachment picker */
      const filesToUpload = selectedFiles.filter((selectedFile) => {
        const uploadedFile = fileUploads.find(
          (fileUpload) =>
            fileUpload.file.uri === selectedFile.uri || fileUpload.url === selectedFile.uri,
        );
        return !uploadedFile;
      });
      filesToUpload.forEach((file) => uploadNewFile(file));
    } else {
      /** User de-selected a video in bottom sheet attachment picker */
      const filesToRemove = fileUploads.filter(
        (fileUpload) =>
          !selectedFiles.find(
            (selectedFile) =>
              selectedFile.uri === fileUpload.file.uri || selectedFile.uri === fileUpload.url,
          ),
      );
      filesToRemove.forEach((file) => removeFile(file.id));
    }
  }, [selectedFilesLength]);

  useEffect(() => {
    if (imagesForInput) {
      if (imageUploadsLength < selectedImagesLength) {
        /** User removed some image from seleted images within ImageUploadPreview. */
        const updatedSelectedImages = selectedImages.filter((selectedImage) => {
          const uploadedImage = imageUploads.find(
            (imageUpload) =>
              imageUpload.file.uri === selectedImage.uri || imageUpload.url === selectedImage.uri,
          );
          return uploadedImage;
        });
        setSelectedImages(updatedSelectedImages);
      } else if (imageUploadsLength > selectedImagesLength) {
        /**
         * User is editing some message which contains image attachments OR
         * image attachment is added from custom image picker (other than the default bottomsheet image picker)
         * using `uploadNewImage` function from `MessageInputContext`.
         **/
        setSelectedImages(
          imageUploads
            .map((imageUpload) => ({
              height: imageUpload.file.height,
              source: imageUpload.file.source,
              uri: imageUpload.url || imageUpload.file.uri,
              width: imageUpload.file.width,
            }))
            .filter(Boolean) as Asset[],
        );
      }
    }
  }, [imageUploadsLength]);

  useEffect(() => {
    if (fileUploadsLength < selectedFilesLength) {
      /** User removed some video from seleted files within ImageUploadPreview. */
      const updatedSelectedFiles = selectedFiles.filter((selectedFile) => {
        const uploadedFile = fileUploads.find(
          (fileUpload) =>
            fileUpload.file.uri === selectedFile.uri || fileUpload.url === selectedFile.uri,
        );
        return uploadedFile;
      });
      setSelectedFiles(updatedSelectedFiles);
    } else if (fileUploadsLength > selectedFilesLength) {
      /**
       * User is editing some message which contains video attachments OR
       * video attachment is added from custom image picker (other than the default bottomsheet image picker)
       * using `uploadNewFile` function from `MessageInputContext`.
       **/
      setSelectedFiles(
        fileUploads.map((fileUpload) => ({
          duration: fileUpload.file.duration,
          name: fileUpload.file.name,
          size: fileUpload.file.size,
          type: fileUpload.file.type,
          uri: fileUpload.file.uri,
        })),
      );
    }
  }, [fileUploadsLength]);

  const editingExists = !!editing;
  useEffect(() => {
    if (editing && inputBoxRef.current) {
      inputBoxRef.current.focus();
    }

    /**
     * Make sure to test `initialValue` functionality, if you are modifying following condition.
     *
     * We have the following condition, to make sure - when user comes out of "editing message" state,
     * we wipe out all the state around message input such as text, mentioned users, image uploads etc.
     * But it also means, this condition will be fired up on first render, which may result in clearing
     * the initial value set on input box, through the prop - `initialValue`.
     * This prop generally gets used for the case of draft message functionality.
     */
    if (
      !editing &&
      (giphyActive ||
        fileUploads.length > 0 ||
        mentionedUsers.length > 0 ||
        imageUploads.length > 0 ||
        numberOfUploads > 0)
    ) {
      resetInput();
    }
  }, [editingExists]);

  const asyncIdsString = asyncIds.join();
  const asyncUploadsString = Object.values(asyncUploads)
    .map(({ state, url }) => `${state}${url}`)
    .join();
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
  }, [asyncIdsString, asyncUploadsString, sendMessageAsync]);

  const getMembers = () => {
    const result: UserResponse<StreamChatGenerics>[] = [];
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) => {
        if (member.user) {
          result.push(member.user);
        }
      });
    }

    return result;
  };

  const getUsers = () => {
    const users = [...getMembers(), ...getWatchers()];

    // make sure we don't list users twice
    const uniqueUsers: { [key: string]: UserResponse<StreamChatGenerics> } = {};
    for (const user of users) {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  const getWatchers = () => {
    const result: UserResponse<StreamChatGenerics>[] = [];
    if (watchers && Object.values(watchers).length) {
      result.push(...Object.values(watchers));
    }

    return result;
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
        style={[styles.container, { backgroundColor: white, borderColor: border }, container]}
      >
        {editing && <InputEditingStateHeader />}
        {quotedMessage && <InputReplyStateHeader />}
        <View style={[styles.composerContainer, composerContainer]}>
          {Input ? (
            <Input
              additionalTextInputProps={additionalTextInputContainerProps}
              getUsers={getUsers}
            />
          ) : (
            <>
              <View style={[styles.optionsContainer, optionsContainer]}>
                {InputButtons && <InputButtons />}
              </View>
              <View
                style={[
                  styles.inputBoxContainer,
                  {
                    borderColor: grey_whisper,
                    paddingVertical: giphyActive ? 8 : 12,
                  },
                  inputBoxContainer,
                ]}
              >
                {((typeof editing !== 'boolean' && editing?.quoted_message) || quotedMessage) && (
                  <View style={[styles.replyContainer, replyContainer]}>
                    <Reply />
                  </View>
                )}
                {imageUploads.length ? <ImageUploadPreview /> : null}
                {imageUploads.length && fileUploads.length ? (
                  <View
                    style={[
                      styles.attachmentSeparator,
                      {
                        borderBottomColor: grey_whisper,
                        marginHorizontal: giphyActive ? 8 : 12,
                      },
                    ]}
                  />
                ) : null}
                {fileUploads.length ? <FileUploadPreview /> : null}
                {giphyActive ? (
                  <InputGiphySearch />
                ) : (
                  <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
                    <AutoCompleteInput<StreamChatGenerics>
                      additionalTextInputProps={additionalTextInputProps}
                      cooldownActive={!!cooldownRemainingSeconds}
                    />
                  </View>
                )}
              </View>
              <View style={[styles.sendButtonContainer, sendButtonContainer]}>
                {cooldownRemainingSeconds ? (
                  <CooldownTimer seconds={cooldownRemainingSeconds} />
                ) : (
                  <SendButton disabled={disabled || sending.current || !isValidMessage()} />
                )}
              </View>
            </>
          )}
        </View>
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </View>

      {triggerType && suggestions ? (
        <View
          style={[
            suggestionListContainer,
            styles.suggestionsListContainer,
            { backgroundColor: white, bottom: height },
          ]}
        >
          <AutoCompleteSuggestionList
            active={!!suggestions}
            data={suggestions.data}
            onSelect={suggestions.onSelect}
            queryText={suggestions.queryText}
            triggerType={triggerType}
          />
        </View>
      ) : null}
      {selectedPicker && (
        <View
          style={[
            {
              backgroundColor: white_smoke,
              height:
                (attachmentPickerBottomSheetHeight
                  ? attachmentPickerBottomSheetHeight + (attachmentSelectionBarHeight ?? 52)
                  : 360) - bottomInset,
            },
            attachmentSelectionBar,
          ]}
        >
          <AttachmentSelectionBar />
        </View>
      )}
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageInputPropsWithContext<StreamChatGenerics>,
  nextProps: MessageInputPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTextInputProps: prevAdditionalTextInputProps,
    asyncUploads: prevAsyncUploads,
    disabled: prevDisabled,
    editing: prevEditing,
    fileUploads: prevFileUploads,
    giphyActive: prevGiphyActive,
    imageUploads: prevImageUploads,
    isValidMessage: prevIsValidMessage,
    mentionedUsers: prevMentionedUsers,
    quotedMessage: prevQuotedMessage,
    sending: prevSending,
    showMoreOptions: prevShowMoreOptions,
    suggestions: prevSuggestions,
    t: prevT,
    thread: prevThread,
    threadList: prevThreadList,
  } = prevProps;
  const {
    additionalTextInputProps: nextAdditionalTextInputProps,
    asyncUploads: nextAsyncUploads,
    disabled: nextDisabled,
    editing: nextEditing,
    fileUploads: nextFileUploads,
    giphyActive: nextGiphyActive,
    imageUploads: nextImageUploads,
    isValidMessage: nextIsValidMessage,
    mentionedUsers: nextMentionedUsers,
    quotedMessage: nextQuotedMessage,
    sending: nextSending,
    showMoreOptions: nextShowMoreOptions,
    suggestions: nextSuggestions,
    t: nextT,
    thread: nextThread,
    threadList: nextThreadList,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) return false;

  const additionalTextInputPropsEven =
    prevAdditionalTextInputProps === nextAdditionalTextInputProps;
  if (!additionalTextInputPropsEven) return false;

  const disabledEqual = prevDisabled === nextDisabled;
  if (!disabledEqual) return false;

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) return false;

  const imageUploadsEqual = prevImageUploads.length === nextImageUploads.length;
  if (!imageUploadsEqual) return false;

  const giphyActiveEqual = prevGiphyActive === nextGiphyActive;
  if (!giphyActiveEqual) return false;

  const quotedMessageEqual =
    !!prevQuotedMessage &&
    !!nextQuotedMessage &&
    typeof prevQuotedMessage !== 'boolean' &&
    typeof nextQuotedMessage !== 'boolean'
      ? prevQuotedMessage.id === nextQuotedMessage.id
      : !!prevQuotedMessage === !!nextQuotedMessage;
  if (!quotedMessageEqual) return false;

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

  const mentionedUsersEqual = prevMentionedUsers.length === nextMentionedUsers.length;
  if (!mentionedUsersEqual) return false;

  const suggestionsEqual =
    !!prevSuggestions?.data && !!nextSuggestions?.data
      ? prevSuggestions.data.length === nextSuggestions.data.length &&
        prevSuggestions.data.every(({ name }, index) => name === nextSuggestions.data[index].name)
      : !!prevSuggestions === !!nextSuggestions;
  if (!suggestionsEqual) return false;

  const threadEqual =
    prevThread?.id === nextThread?.id &&
    prevThread?.text === nextThread?.text &&
    prevThread?.reply_count === nextThread?.reply_count;
  if (!threadEqual) return false;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) return false;

  return true;
};

const MemoizedMessageInput = React.memo(
  MessageInputWithContext,
  areEqual,
) as typeof MessageInputWithContext;

export type MessageInputProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageInputPropsWithContext<StreamChatGenerics>>;

/**
 * UI Component for message input
 * It's a consumer of
 * [Channel Context](https://getstream.github.io/stream-chat-react-native/v3/#channelcontext),
 * [Chat Context](https://getstream.github.io/stream-chat-react-native/v3/#chatcontext),
 * [MessageInput Context](https://getstream.github.io/stream-chat-react-native/v3/#messageinputcontext),
 * [Suggestions Context](https://getstream.github.io/stream-chat-react-native/v3/#suggestionscontext), and
 * [Translation Context](https://getstream.github.io/stream-chat-react-native/v3/#translationcontext)
 */
export const MessageInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageInputProps<StreamChatGenerics>,
) => {
  const ownCapabilities = useOwnCapabilitiesContext();

  const { disabled = false, members, watchers } = useChannelContext<StreamChatGenerics>();

  const {
    additionalTextInputProps,
    asyncIds,
    asyncUploads,
    clearEditingState,
    clearQuotedMessageState,
    closeAttachmentPicker,
    cooldownEndsAt,
    CooldownTimer,
    editing,
    FileUploadPreview,
    fileUploads,
    giphyActive,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    InputGiphySearch,
    InputReplyStateHeader,
    isValidMessage,
    maxNumberOfFiles,
    mentionedUsers,
    numberOfUploads,
    quotedMessage,
    removeFile,
    removeImage,
    resetInput,
    SendButton,
    sending,
    sendMessageAsync,
    SendMessageDisallowedIndicator,
    setGiphyActive,
    setShowMoreOptions,
    showMoreOptions,
    ShowThreadMessageInChannelButton,
    uploadNewFile,
    uploadNewImage,
  } = useMessageInputContext<StreamChatGenerics>();

  const { Reply } = useMessagesContext<StreamChatGenerics>();

  const {
    AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem,
    AutoCompleteSuggestionList,
    suggestions,
    triggerType,
  } = useSuggestionsContext<StreamChatGenerics>();

  const { thread } = useThreadContext<StreamChatGenerics>();

  const { t } = useTranslationContext();

  if (!ownCapabilities.sendMessage && SendMessageDisallowedIndicator) {
    return <SendMessageDisallowedIndicator />;
  }

  return (
    <MemoizedMessageInput
      {...{
        additionalTextInputProps,
        asyncIds,
        asyncUploads,
        AutoCompleteSuggestionHeader,
        AutoCompleteSuggestionItem,
        AutoCompleteSuggestionList,
        clearEditingState,
        clearQuotedMessageState,
        closeAttachmentPicker,
        cooldownEndsAt,
        CooldownTimer,
        disabled,
        editing,
        FileUploadPreview,
        fileUploads,
        giphyActive,
        ImageUploadPreview,
        imageUploads,
        Input,
        inputBoxRef,
        InputButtons,
        InputEditingStateHeader,
        InputGiphySearch,
        InputReplyStateHeader,
        isValidMessage,
        maxNumberOfFiles,
        members,
        mentionedUsers,
        numberOfUploads,
        quotedMessage,
        removeFile,
        removeImage,
        Reply,
        resetInput,
        SendButton,
        sending,
        sendMessageAsync,
        setGiphyActive,
        setShowMoreOptions,
        showMoreOptions,
        ShowThreadMessageInChannelButton,
        suggestions,
        t,
        thread,
        triggerType,
        uploadNewFile,
        uploadNewImage,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
