import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  NativeSyntheticEvent,
  StyleSheet,
  TextInputFocusEventData,
  View,
} from 'react-native';

import {
  GestureEvent,
  PanGestureHandler,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { UserResponse } from 'stream-chat';

import { useAudioController } from './hooks/useAudioController';
import { useCountdown } from './hooks/useCountdown';

import { ChatContextValue, useChatContext } from '../../contexts';
import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
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

import { triggerHaptic } from '../../native';
import type { Asset, DefaultStreamChatGenerics } from '../../types/types';
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    borderTopWidth: 1,
    padding: 10,
  },
  inputBoxContainer: {
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 10,
  },
  micButtonContainer: {},
  optionsContainer: {
    flexDirection: 'row',
  },
  replyContainer: { paddingBottom: 12, paddingHorizontal: 8 },
  sendButtonContainer: {},
  suggestionsListContainer: {
    position: 'absolute',
    width: '100%',
  },
});

type MessageInputPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<AttachmentPickerContextValue, 'AttachmentPickerSelectionBar'> &
  Pick<ChatContextValue<StreamChatGenerics>, 'isOnline'> &
  Pick<
    ChannelContextValue<StreamChatGenerics>,
    'disabled' | 'members' | 'threadList' | 'watchers'
  > &
  Pick<
    MessageInputContextValue<StreamChatGenerics>,
    | 'additionalTextInputProps'
    | 'asyncIds'
    | 'audioRecordingEnabled'
    | 'asyncMessagesLockDistance'
    | 'asyncMessagesMinimumPressDuration'
    | 'asyncMessagesSlideToCancelDistance'
    | 'asyncUploads'
    | 'AudioRecorder'
    | 'AudioRecordingInProgress'
    | 'AudioRecordingLockIndicator'
    | 'AudioRecordingPreview'
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
    | 'StartAudioRecordingButton'
    | 'removeFile'
    | 'removeImage'
    | 'text'
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
  Pick<TranslationContextValue, 't'>;

const MessageInputWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageInputPropsWithContext<StreamChatGenerics>,
) => {
  const {
    additionalTextInputProps,
    asyncIds,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance,
    asyncUploads,
    AttachmentPickerSelectionBar,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
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
    isOnline,
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
    setShowMoreOptions,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    suggestions,
    text,
    thread,
    threadList,
    triggerType,
    uploadNewFile,
    uploadNewImage,
    watchers,
  } = props;

  const [height, setHeight] = useState(0);
  const { t } = useTranslationContext();

  const {
    theme: {
      colors: { border, grey_whisper, white, white_smoke },
      messageInput: {
        attachmentSelectionBar,
        attachmentSeparator,
        autoCompleteInputContainer,
        composerContainer,
        container,
        focusedInputBoxContainer,
        inputBoxContainer,
        micButtonContainer,
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
  const [focused, setFocused] = useState(false);
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

  const MEGA_BYTES_TO_BYTES = 1024 * 1024;
  const MAX_FILE_SIZE_TO_UPLOAD_IN_MB = 100;

  const uploadImagesHandler = () => {
    const imageToUpload = selectedImages.find((selectedImage) => {
      const uploadedImage = imageUploads.find(
        (imageUpload) =>
          imageUpload.file.uri === selectedImage.uri || imageUpload.url === selectedImage.uri,
      );
      return !uploadedImage;
    });
    // Check if the file size of the image exceeds the threshold of 100MB
    if (
      imageToUpload &&
      Number(imageToUpload.size) / MEGA_BYTES_TO_BYTES > MAX_FILE_SIZE_TO_UPLOAD_IN_MB
    ) {
      Alert.alert(
        t(
          `Maximum file size upload limit reached. Please upload a file below {{MAX_FILE_SIZE_TO_UPLOAD_IN_MB}} MB.`,
          { MAX_FILE_SIZE_TO_UPLOAD_IN_MB },
        ),
      );
      setSelectedImages(
        selectedImages.filter((selectedImage) => selectedImage.uri !== imageToUpload.uri),
      );
    } else {
      if (imageToUpload) uploadNewImage(imageToUpload);
    }
  };

  const removeImagesHandler = () => {
    const imagesToRemove = imageUploads.filter(
      (imageUpload) =>
        !selectedImages.find(
          (selectedImage) =>
            selectedImage.uri === imageUpload.file.uri || selectedImage.uri === imageUpload.url,
        ),
    );
    imagesToRemove.forEach((image) => removeImage(image.id));
  };

  useEffect(() => {
    if (imagesForInput) {
      if (selectedImagesLength > imageUploadsLength) {
        /** User selected an image in bottom sheet attachment picker */
        uploadImagesHandler();
      } else {
        /** User de-selected an image in bottom sheet attachment picker */
        removeImagesHandler();
      }
    }
  }, [selectedImagesLength]);

  useEffect(() => {
    if (selectedFilesLength > fileUploadsLength) {
      /** User selected a video in bottom sheet attachment picker */
      const fileToUpload = selectedFiles.find((selectedFile) => {
        const uploadedFile = fileUploads.find(
          (fileUpload) =>
            fileUpload.file.uri === selectedFile.uri || fileUpload.url === selectedFile.uri,
        );
        return !uploadedFile;
      });
      // Check if the file size exceeds the threshold of 100MB
      if (
        fileToUpload &&
        Number(fileToUpload.size) / MEGA_BYTES_TO_BYTES > MAX_FILE_SIZE_TO_UPLOAD_IN_MB
      ) {
        Alert.alert(
          t(
            `Maximum file size upload limit reached. Please upload a file below {{MAX_FILE_SIZE_TO_UPLOAD_IN_MB}} MB.`,
            { MAX_FILE_SIZE_TO_UPLOAD_IN_MB },
          ),
        );
        setSelectedFiles(
          selectedFiles.filter((selectedFile) => selectedFile.uri !== fileToUpload.uri),
        );
      } else {
        if (fileToUpload) uploadNewFile(fileToUpload);
      }
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
       * video attachment is added from custom image picker (other than the default bottom-sheet image picker)
       * using `uploadNewFile` function from `MessageInputContext`.
       **/
      setSelectedFiles(
        fileUploads.map((fileUpload) => ({
          duration: fileUpload.file.duration,
          mimeType: fileUpload.file.mimeType,
          name: fileUpload.file.name,
          size: fileUpload.file.size,
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

  const memoizedAdditionalTextInputProps = useMemo(
    () => ({
      ...additionalTextInputProps,
      onBlur: (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        if (additionalTextInputProps?.onBlur) {
          additionalTextInputProps?.onBlur(event);
        }
        if (setFocused) setFocused(false);
        setShowMoreOptions(true);
      },
      onFocus: (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
        if (additionalTextInputProps?.onFocus) {
          additionalTextInputProps.onFocus(event);
        }
        if (setFocused) setFocused(true);
      },
    }),
    [additionalTextInputProps],
  );

  const {
    deleteVoiceRecording,
    micLocked,
    onVoicePlayerPlayPause,
    paused,
    permissionsGranted,
    position,
    progress,
    recording,
    recordingDuration,
    recordingStatus,
    setMicLocked,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
    waveformData,
  } = useAudioController();

  const isSendingButtonVisible = () => {
    if (audioRecordingEnabled) {
      if (recording) {
        return false;
      }
      if (text && text.trim()) {
        return true;
      }

      const imagesAndFiles = [...imageUploads, ...fileUploads];
      if (imagesAndFiles.length === 0) return false;
    }

    return true;
  };

  const micPositionX = useSharedValue(0);
  const micPositionY = useSharedValue(0);
  const X_AXIS_POSITION = -asyncMessagesSlideToCancelDistance;
  const Y_AXIS_POSITION = -asyncMessagesLockDistance;

  const resetAudioRecording = async () => {
    await deleteVoiceRecording();
    micPositionX.value = 0;
  };

  const micLockHandler = () => {
    setMicLocked(true);
    micPositionY.value = 0;
    triggerHaptic('impactMedium');
  };

  const handleMicGestureEvent = useAnimatedGestureHandler<
    GestureEvent<PanGestureHandlerEventPayload>
  >({
    onActive: (event) => {
      const newPositionX = event.translationX;
      const newPositionY = event.translationY;

      if (newPositionX <= 0 && newPositionX >= X_AXIS_POSITION) {
        micPositionX.value = newPositionX;
      }
      if (newPositionY <= 0 && newPositionY >= Y_AXIS_POSITION) {
        micPositionY.value = newPositionY;
      }
    },
    onFinish: () => {
      if (micPositionY.value > Y_AXIS_POSITION / 2) {
        micPositionY.value = withSpring(0);
      } else {
        micPositionY.value = withSpring(Y_AXIS_POSITION);
        runOnJS(micLockHandler)();
      }
      if (micPositionX.value > X_AXIS_POSITION / 2) {
        micPositionX.value = withSpring(0);
      } else {
        micPositionX.value = withSpring(X_AXIS_POSITION);
        runOnJS(resetAudioRecording)();
      }
    },
    onStart: () => {
      micPositionX.value = 0;
      micPositionY.value = 0;
      runOnJS(setMicLocked)(false);
    },
  });

  const animatedStyles = {
    lockIndicator: useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            micPositionY.value,
            [0, Y_AXIS_POSITION],
            [0, Y_AXIS_POSITION],
            Extrapolation.CLAMP,
          ),
        },
      ],
    })),
    micButton: useAnimatedStyle(() => ({
      opacity: interpolate(micPositionX.value, [0, X_AXIS_POSITION], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: micPositionX.value }, { translateY: micPositionY.value }],
      zIndex: 2,
    })),
    slideToCancel: useAnimatedStyle(() => ({
      opacity: interpolate(micPositionX.value, [0, X_AXIS_POSITION], [1, 0], Extrapolation.CLAMP),
      transform: [
        {
          translateX: interpolate(
            micPositionX.value,
            [0, X_AXIS_POSITION],
            [0, X_AXIS_POSITION / 2],
            Extrapolation.CLAMP,
          ),
        },
      ],
    })),
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
        {recording && (
          <>
            <AudioRecordingLockIndicator
              messageInputHeight={height}
              micLocked={micLocked}
              style={animatedStyles.lockIndicator}
            />
            {micLocked &&
              (recordingStatus === 'stopped' ? (
                <AudioRecordingPreview
                  onVoicePlayerPlayPause={onVoicePlayerPlayPause}
                  paused={paused}
                  position={position}
                  progress={progress}
                  waveformData={waveformData}
                />
              ) : (
                <AudioRecordingInProgress
                  recordingDuration={recordingDuration}
                  waveformData={waveformData}
                />
              ))}
          </>
        )}

        <View style={[styles.composerContainer, composerContainer]}>
          {Input ? (
            <Input
              additionalTextInputProps={additionalTextInputContainerProps}
              getUsers={getUsers}
            />
          ) : (
            <>
              {recording ? (
                <AudioRecorder
                  deleteVoiceRecording={deleteVoiceRecording}
                  micLocked={micLocked}
                  recording={recording}
                  recordingDuration={recordingDuration}
                  recordingStopped={recordingStatus === 'stopped'}
                  slideToCancelStyle={animatedStyles.slideToCancel}
                  stopVoiceRecording={stopVoiceRecording}
                  uploadVoiceRecording={uploadVoiceRecording}
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
                      focused ? focusedInputBoxContainer : null,
                    ]}
                  >
                    {((typeof editing !== 'boolean' && editing?.quoted_message) ||
                      quotedMessage) && (
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
                          attachmentSeparator,
                        ]}
                      />
                    ) : null}
                    {fileUploads.length ? <FileUploadPreview /> : null}
                    {giphyActive ? (
                      <InputGiphySearch disabled={!isOnline} />
                    ) : (
                      <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
                        <AutoCompleteInput<StreamChatGenerics>
                          additionalTextInputProps={memoizedAdditionalTextInputProps}
                          cooldownActive={!!cooldownRemainingSeconds}
                        />
                      </View>
                    )}
                  </View>
                </>
              )}

              {isSendingButtonVisible() &&
                (cooldownRemainingSeconds ? (
                  <CooldownTimer seconds={cooldownRemainingSeconds} />
                ) : (
                  <View style={[styles.sendButtonContainer, sendButtonContainer]}>
                    <SendButton
                      disabled={
                        disabled ||
                        sending.current ||
                        !isValidMessage() ||
                        (giphyActive && !isOnline)
                      }
                    />
                  </View>
                ))}
              {audioRecordingEnabled && !micLocked && (
                <PanGestureHandler
                  activateAfterLongPress={asyncMessagesMinimumPressDuration + 100}
                  onGestureEvent={handleMicGestureEvent}
                >
                  <Animated.View
                    style={[
                      styles.micButtonContainer,
                      animatedStyles.micButton,
                      micButtonContainer,
                    ]}
                  >
                    <StartAudioRecordingButton
                      permissionsGranted={permissionsGranted}
                      recording={recording}
                      startVoiceRecording={startVoiceRecording}
                    />
                  </Animated.View>
                </PanGestureHandler>
              )}
            </>
          )}
        </View>
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </View>

      {triggerType && suggestions ? (
        <View
          style={[styles.suggestionsListContainer, { bottom: height }, suggestionListContainer]}
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
                attachmentPickerBottomSheetHeight + attachmentSelectionBarHeight - bottomInset,
            },
            attachmentSelectionBar,
          ]}
        >
          <AttachmentPickerSelectionBar />
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
    asyncMessagesLockDistance: prevAsyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration: prevAsyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance: prevAsyncMessagesSlideToCancelDistance,
    asyncUploads: prevAsyncUploads,
    audioRecordingEnabled: prevAsyncMessagesEnabled,
    disabled: prevDisabled,
    editing: prevEditing,
    fileUploads: prevFileUploads,
    giphyActive: prevGiphyActive,
    imageUploads: prevImageUploads,
    isOnline: prevIsOnline,
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
    asyncMessagesLockDistance: nextAsyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration: nextAsyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance: nextAsyncMessagesSlideToCancelDistance,
    asyncUploads: nextAsyncUploads,
    audioRecordingEnabled: nextAsyncMessagesEnabled,
    disabled: nextDisabled,
    editing: nextEditing,
    fileUploads: nextFileUploads,
    giphyActive: nextGiphyActive,
    imageUploads: nextImageUploads,
    isOnline: nextIsOnline,
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

  const asyncMessagesEnabledEqual = prevAsyncMessagesEnabled === nextAsyncMessagesEnabled;
  if (!asyncMessagesEnabledEqual) return false;

  const asyncMessagesLockDistanceEqual =
    prevAsyncMessagesLockDistance === nextAsyncMessagesLockDistance;
  if (!asyncMessagesLockDistanceEqual) return false;

  const asyncMessagesMinimumPressDurationEqual =
    prevAsyncMessagesMinimumPressDuration === nextAsyncMessagesMinimumPressDuration;
  if (!asyncMessagesMinimumPressDurationEqual) return false;

  const asyncMessagesSlideToCancelDistanceEqual =
    prevAsyncMessagesSlideToCancelDistance === nextAsyncMessagesSlideToCancelDistance;
  if (!asyncMessagesSlideToCancelDistanceEqual) return false;

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

  const isOnlineEqual = prevIsOnline === nextIsOnline;
  if (!isOnlineEqual) return false;

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
 * [Channel Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/channel-context/),
 * [Chat Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/chat-context/),
 * [MessageInput Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/message-input-context/),
 * [Suggestions Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/suggestions-context/), and
 * [Translation Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/translation-context/)
 */
export const MessageInput = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageInputProps<StreamChatGenerics>,
) => {
  const { AttachmentPickerSelectionBar } = useAttachmentPickerContext();
  const { isOnline } = useChatContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const { disabled, members, threadList, watchers } = useChannelContext<StreamChatGenerics>();

  const {
    additionalTextInputProps,
    asyncIds,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance,
    asyncUploads,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AudioRecordingWaveform,
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
    StartAudioRecordingButton,
    text,
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

  if ((disabled || !ownCapabilities.sendMessage) && SendMessageDisallowedIndicator) {
    return <SendMessageDisallowedIndicator />;
  }

  return (
    <MemoizedMessageInput
      {...{
        additionalTextInputProps,
        asyncIds,
        asyncMessagesLockDistance,
        asyncMessagesMinimumPressDuration,
        asyncMessagesSlideToCancelDistance,
        asyncUploads,
        AttachmentPickerSelectionBar,
        AudioRecorder,
        audioRecordingEnabled,
        AudioRecordingInProgress,
        AudioRecordingLockIndicator,
        AudioRecordingPreview,
        AudioRecordingWaveform,
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
        isOnline,
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
        SendMessageDisallowedIndicator,
        setGiphyActive,
        setShowMoreOptions,
        showMoreOptions,
        ShowThreadMessageInChannelButton,
        StartAudioRecordingButton,
        suggestions,
        t,
        text,
        thread,
        threadList,
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
