import React, { useCallback, useEffect, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, View } from 'react-native';

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type {
  CustomDataManagerState,
  MessageComposerState,
  TextComposerState,
  UserResponse,
} from 'stream-chat';

import { useAudioController } from './hooks/useAudioController';
import { useCountdown } from './hooks/useCountdown';

import { ChatContextValue, useChatContext, useOwnCapabilitiesContext } from '../../contexts';
import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { useStateStore } from '../../hooks/useStateStore';
import {
  isAudioRecorderAvailable,
  isImageMediaLibraryAvailable,
  NativeHandlers,
} from '../../native';
import { compressedImageURI } from '../../utils/compressImage';
import { AIStates, useAIState } from '../AITypingIndicatorView';
import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';
import { CreatePoll } from '../Poll/CreatePollContent';

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

type MessageInputPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'AttachmentPickerSelectionBar'
> &
  Pick<ChatContextValue, 'isOnline'> &
  Pick<ChannelContextValue, 'channel' | 'members' | 'threadList' | 'watchers'> &
  Pick<
    MessageInputContextValue,
    | 'additionalTextInputProps'
    | 'asyncIds'
    | 'audioRecordingEnabled'
    | 'asyncMessagesLockDistance'
    | 'asyncMessagesMinimumPressDuration'
    | 'asyncMessagesSlideToCancelDistance'
    | 'asyncMessagesMultiSendEnabled'
    | 'asyncUploads'
    | 'AudioRecorder'
    | 'AudioRecordingInProgress'
    | 'AudioRecordingLockIndicator'
    | 'AudioRecordingPreview'
    | 'AutoCompleteSuggestionList'
    | 'cooldownEndsAt'
    | 'CooldownTimer'
    | 'clearEditingState'
    | 'closeAttachmentPicker'
    | 'compressImageQuality'
    | 'editing'
    | 'FileUploadPreview'
    | 'fileUploads'
    | 'ImageUploadPreview'
    | 'imageUploads'
    | 'Input'
    | 'inputBoxRef'
    | 'InputButtons'
    | 'InputEditingStateHeader'
    | 'CommandInput'
    | 'InputReplyStateHeader'
    | 'isValidMessage'
    | 'maxNumberOfFiles'
    | 'numberOfUploads'
    | 'resetInput'
    | 'SendButton'
    | 'sending'
    | 'sendMessageAsync'
    | 'setShowMoreOptions'
    | 'showMoreOptions'
    | 'ShowThreadMessageInChannelButton'
    | 'StartAudioRecordingButton'
    | 'removeFile'
    | 'removeImage'
    | 'uploadNewFile'
    | 'uploadNewImage'
    | 'openPollCreationDialog'
    | 'closePollCreationDialog'
    | 'showPollCreationDialog'
    | 'sendMessage'
    | 'CreatePollContent'
    | 'StopMessageStreamingButton'
  > &
  Pick<MessagesContextValue, 'Reply'> &
  Pick<ThreadContextValue, 'thread'> &
  Pick<TranslationContextValue, 't'>;

const textComposerStateSelector = (state: TextComposerState) => ({
  mentionedUsers: state.mentionedUsers,
  suggestions: state.suggestions,
  text: state.text,
});

const customComposerDataSelector = (state: CustomDataManagerState) => ({
  command: state.custom.command,
});

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const MessageInputWithContext = (props: MessageInputPropsWithContext) => {
  const {
    additionalTextInputProps,
    asyncIds,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesMultiSendEnabled,
    asyncMessagesSlideToCancelDistance,
    asyncUploads,
    AttachmentPickerSelectionBar,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AutoCompleteSuggestionList,
    channel,
    closeAttachmentPicker,
    closePollCreationDialog,
    compressImageQuality,
    cooldownEndsAt,
    CooldownTimer,
    CreatePollContent,
    editing,
    FileUploadPreview,
    fileUploads,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    CommandInput,
    InputReplyStateHeader,
    isOnline,
    isValidMessage,
    maxNumberOfFiles,
    members,
    numberOfUploads,
    removeFile,
    removeImage,
    Reply,
    resetInput,
    SendButton,
    sending,
    sendMessage,
    sendMessageAsync,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    thread,
    threadList,
    uploadNewFile,
    uploadNewImage,
    watchers,
  } = props;

  const messageComposer = useMessageComposer();
  const { customDataManager, textComposer } = messageComposer;
  const { mentionedUsers, text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { command } = useStateStore(customDataManager.state, customComposerDataSelector);
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);

  const [height, setHeight] = useState(0);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [hasResetImages, setHasResetImages] = useState(false);
  const [hasResetFiles, setHasResetFiles] = useState(false);
  const selectedImagesLength = hasResetImages ? selectedImages.length : 0;
  const imageUploadsLength = hasResetImages ? imageUploads.length : 0;
  const selectedFilesLength = hasResetFiles ? selectedFiles.length : 0;
  const fileUploadsLength = hasResetFiles ? fileUploads.length : 0;
  const imagesForInput = (!!thread && !!threadList) || (!thread && !threadList);

  /**
   * Reset the selected images when the component is unmounted.
   */
  useEffect(() => {
    setSelectedImages([]);
    if (imageUploads.length) {
      imageUploads.forEach((image) => removeImage(image.id));
    }
    return () => setSelectedImages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Reset the selected files when the component is unmounted.
   */
  useEffect(() => {
    setSelectedFiles([]);
    if (fileUploads.length) {
      fileUploads.forEach((file) => removeFile(file.id));
    }

    return () => setSelectedFiles([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasResetImages === false && imageUploadsLength === 0 && selectedImagesLength === 0) {
      setHasResetImages(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUploadsLength, selectedImagesLength]);

  useEffect(() => {
    if (hasResetFiles === false && fileUploadsLength === 0 && selectedFilesLength === 0) {
      setHasResetFiles(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUploadsLength, selectedFilesLength]);

  useEffect(() => {
    if (imagesForInput === false && imageUploadsLength) {
      imageUploads.forEach((image) => removeImage(image.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesForInput, imageUploadsLength]);

  const uploadImagesHandler = async () => {
    const imageToUpload = selectedImages.find((selectedImage) => {
      const uploadedImage = imageUploads.find(
        (imageUpload) =>
          imageUpload.file.uri === selectedImage.uri || imageUpload.url === selectedImage.uri,
      );
      return !uploadedImage;
    });

    if (imageToUpload) {
      const compressedImage = await compressedImageURI(imageToUpload, compressImageQuality);
      uploadNewImage({
        ...imageToUpload,
        uri: compressedImage,
      });
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

  const uploadFilesHandler = async () => {
    const fileToUpload = selectedFiles.find((selectedFile) => {
      const uploadedFile = fileUploads.find(
        (fileUpload) =>
          fileUpload.file.uri === selectedFile.uri || fileUpload.url === selectedFile.uri,
      );
      return !uploadedFile;
    });
    if (fileToUpload) {
      await uploadNewFile(fileToUpload);
    }
  };

  const removeFilesHandler = () => {
    const filesToRemove = fileUploads.filter(
      (fileUpload) =>
        !selectedFiles.find(
          (selectedFile) =>
            selectedFile.uri === fileUpload.file.uri || selectedFile.uri === fileUpload.url,
        ),
    );
    filesToRemove.forEach((file) => removeFile(file.id));
  };

  /**
   * When a user selects or deselects an image in the image picker using media library.
   */
  useEffect(() => {
    const uploadOrRemoveImage = async () => {
      if (imagesForInput) {
        if (selectedImagesLength > imageUploadsLength) {
          /** User selected an image in bottom sheet attachment picker */
          await uploadImagesHandler();
        } else {
          /** User de-selected an image in bottom sheet attachment picker */
          removeImagesHandler();
        }
      }
    };
    // If image picker is not available, don't do anything
    if (!isImageMediaLibraryAvailable()) {
      return;
    }
    uploadOrRemoveImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImagesLength]);

  /**
   * When a user selects or deselects a video in the image picker using media library.
   */
  useEffect(() => {
    const uploadOrRemoveFile = async () => {
      if (selectedFilesLength > fileUploadsLength) {
        /** User selected a video in bottom sheet attachment picker */
        await uploadFilesHandler();
      } else {
        /** User de-selected a video in bottom sheet attachment picker */
        removeFilesHandler();
      }
    };
    uploadOrRemoveFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilesLength]);

  /**
   * This is for image attachments selected from attachment picker.
   */
  useEffect(() => {
    if (imagesForInput && isImageMediaLibraryAvailable()) {
      if (imageUploadsLength < selectedImagesLength) {
        // /** User removed some image from seleted images within ImageUploadPreview. */
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
         * User is editing some message which contains image attachments.
         **/
        setSelectedImages(imageUploads.map((imageUpload) => imageUpload.file));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUploadsLength]);

  /**
   * This is for video attachments selected from attachment picker.
   */
  useEffect(() => {
    if (isImageMediaLibraryAvailable()) {
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
         * User is editing some message which contains video attachments.
         **/
        setSelectedFiles(fileUploads.map((fileUpload) => fileUpload.file));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      (command ||
        fileUploads.length > 0 ||
        mentionedUsers.length > 0 ||
        imageUploads.length > 0 ||
        numberOfUploads > 0) &&
      resetInput
    ) {
      resetInput();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncIdsString, asyncUploadsString, sendMessageAsync]);

  const getMembers = () => {
    const result: UserResponse[] = [];
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
    const uniqueUsers: { [key: string]: UserResponse } = {};
    for (const user of users) {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  const getWatchers = () => {
    const result: UserResponse[] = [];
    if (watchers && Object.values(watchers).length) {
      result.push(...Object.values(watchers));
    }

    return result;
  };

  const isFocused = inputBoxRef.current?.isFocused();

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
    if (audioRecordingEnabled && isAudioRecorderAvailable()) {
      if (recording) {
        return false;
      }
      if (text && text.trim()) {
        return true;
      }

      const imagesAndFiles = [...imageUploads, ...fileUploads];
      if (imagesAndFiles.length === 0) {
        return false;
      }
    }

    return true;
  };

  const micPositionX = useSharedValue(0);
  const micPositionY = useSharedValue(0);
  const X_AXIS_POSITION = -asyncMessagesSlideToCancelDistance;
  const Y_AXIS_POSITION = -asyncMessagesLockDistance;

  const resetAudioRecording = async () => {
    await deleteVoiceRecording();
  };

  const micLockHandler = () => {
    setMicLocked(true);
    NativeHandlers.triggerHaptic('impactMedium');
  };

  const panGestureMic = Gesture.Pan()
    .activateAfterLongPress(asyncMessagesMinimumPressDuration + 100)
    .onChange((event: PanGestureHandlerEventPayload) => {
      const newPositionX = event.translationX;
      const newPositionY = event.translationY;

      if (newPositionX <= 0 && newPositionX >= X_AXIS_POSITION) {
        micPositionX.value = newPositionX;
      }
      if (newPositionY <= 0 && newPositionY >= Y_AXIS_POSITION) {
        micPositionY.value = newPositionY;
      }
    })
    .onEnd(() => {
      const belowThresholdY = micPositionY.value > Y_AXIS_POSITION / 2;
      const belowThresholdX = micPositionX.value > X_AXIS_POSITION / 2;

      if (belowThresholdY && belowThresholdX) {
        micPositionY.value = withSpring(0);
        micPositionX.value = withSpring(0);
        if (recordingStatus === 'recording') {
          runOnJS(uploadVoiceRecording)(asyncMessagesMultiSendEnabled);
        }
        return;
      }

      if (!belowThresholdY) {
        micPositionY.value = withSpring(Y_AXIS_POSITION);
        runOnJS(micLockHandler)();
      }

      if (!belowThresholdX) {
        micPositionX.value = withSpring(X_AXIS_POSITION);
        runOnJS(resetAudioRecording)();
      }

      micPositionX.value = 0;
      micPositionY.value = 0;
    })
    .onStart(() => {
      micPositionX.value = 0;
      micPositionY.value = 0;
      runOnJS(setMicLocked)(false);
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

  const { aiState } = useAIState(channel);

  const stopGenerating = useCallback(() => channel?.stopAIResponse(), [channel]);
  const shouldDisplayStopAIGeneration =
    [AIStates.Thinking, AIStates.Generating].includes(aiState) && !!StopMessageStreamingButton;

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
        {quotedMessage && !editing && <InputReplyStateHeader />}
        {recording && (
          <>
            <AudioRecordingLockIndicator
              messageInputHeight={height}
              micLocked={micLocked}
              style={animatedStyles.lockIndicator}
            />
            {recordingStatus === 'stopped' ? (
              <AudioRecordingPreview
                onVoicePlayerPlayPause={onVoicePlayerPlayPause}
                paused={paused}
                position={position}
                progress={progress}
                waveformData={waveformData}
              />
            ) : micLocked ? (
              <AudioRecordingInProgress
                recordingDuration={recordingDuration}
                waveformData={waveformData}
              />
            ) : null}
          </>
        )}

        <View style={[styles.composerContainer, composerContainer]}>
          {Input ? (
            <Input additionalTextInputProps={additionalTextInputProps} getUsers={getUsers} />
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
                        paddingVertical: command ? 8 : 12,
                      },
                      inputBoxContainer,
                      isFocused ? focusedInputBoxContainer : null,
                    ]}
                  >
                    {quotedMessage && (
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
                            marginHorizontal: command ? 8 : 12,
                          },
                          attachmentSeparator,
                        ]}
                      />
                    ) : null}
                    {fileUploads.length ? <FileUploadPreview /> : null}
                    {command ? (
                      <CommandInput disabled={!isOnline} />
                    ) : (
                      <View style={[styles.autoCompleteInputContainer, autoCompleteInputContainer]}>
                        <AutoCompleteInput
                          cooldownActive={!!cooldownRemainingSeconds}
                          {...additionalTextInputProps}
                        />
                      </View>
                    )}
                  </View>
                </>
              )}

              {shouldDisplayStopAIGeneration ? (
                <StopMessageStreamingButton onPress={stopGenerating} />
              ) : isSendingButtonVisible() ? (
                cooldownRemainingSeconds ? (
                  <CooldownTimer seconds={cooldownRemainingSeconds} />
                ) : (
                  <View style={[styles.sendButtonContainer, sendButtonContainer]}>
                    <SendButton
                      disabled={sending.current || !isValidMessage() || (!!command && !isOnline)}
                    />
                  </View>
                )
              ) : null}
              {audioRecordingEnabled && isAudioRecorderAvailable() && !micLocked && (
                <GestureDetector gesture={panGestureMic}>
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
                </GestureDetector>
              )}
            </>
          )}
        </View>
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </View>

      <View style={[styles.suggestionsListContainer, { bottom: height }, suggestionListContainer]}>
        <AutoCompleteSuggestionList />
      </View>

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
      {showPollCreationDialog ? (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Modal
            animationType='slide'
            onRequestClose={closePollCreationDialog}
            visible={showPollCreationDialog}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
                <CreatePoll
                  closePollCreationDialog={closePollCreationDialog}
                  CreatePollContent={CreatePollContent}
                  sendMessage={sendMessage}
                />
              </SafeAreaView>
            </GestureHandlerRootView>
          </Modal>
        </View>
      ) : null}
    </>
  );
};

const areEqual = (
  prevProps: MessageInputPropsWithContext,
  nextProps: MessageInputPropsWithContext,
) => {
  const {
    additionalTextInputProps: prevAdditionalTextInputProps,
    asyncMessagesLockDistance: prevAsyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration: prevAsyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance: prevAsyncMessagesSlideToCancelDistance,
    asyncUploads: prevAsyncUploads,
    audioRecordingEnabled: prevAsyncMessagesEnabled,
    channel: prevChannel,
    closePollCreationDialog: prevClosePollCreationDialog,
    editing: prevEditing,
    fileUploads: prevFileUploads,
    imageUploads: prevImageUploads,
    isOnline: prevIsOnline,
    isValidMessage: prevIsValidMessage,
    openPollCreationDialog: prevOpenPollCreationDialog,
    sending: prevSending,
    showMoreOptions: prevShowMoreOptions,
    showPollCreationDialog: prevShowPollCreationDialog,
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
    channel: nextChannel,
    closePollCreationDialog: nextClosePollCreationDialog,
    editing: nextEditing,
    fileUploads: nextFileUploads,
    imageUploads: nextImageUploads,
    isOnline: nextIsOnline,
    isValidMessage: nextIsValidMessage,
    openPollCreationDialog: nextOpenPollCreationDialog,
    sending: nextSending,
    showMoreOptions: nextShowMoreOptions,
    showPollCreationDialog: nextShowPollCreationDialog,
    t: nextT,
    thread: nextThread,
    threadList: nextThreadList,
  } = nextProps;

  const tEqual = prevT === nextT;
  if (!tEqual) {
    return false;
  }

  const pollCreationInputPropsEqual =
    prevOpenPollCreationDialog === nextOpenPollCreationDialog &&
    prevClosePollCreationDialog === nextClosePollCreationDialog &&
    prevShowPollCreationDialog === nextShowPollCreationDialog;
  if (!pollCreationInputPropsEqual) {
    return false;
  }

  const additionalTextInputPropsEven =
    prevAdditionalTextInputProps === nextAdditionalTextInputProps;
  if (!additionalTextInputPropsEven) {
    return false;
  }

  const asyncMessagesEnabledEqual = prevAsyncMessagesEnabled === nextAsyncMessagesEnabled;
  if (!asyncMessagesEnabledEqual) {
    return false;
  }

  const channelEqual = prevChannel.cid === nextChannel.cid;
  if (!channelEqual) {
    return false;
  }

  const asyncMessagesLockDistanceEqual =
    prevAsyncMessagesLockDistance === nextAsyncMessagesLockDistance;
  if (!asyncMessagesLockDistanceEqual) {
    return false;
  }

  const asyncMessagesMinimumPressDurationEqual =
    prevAsyncMessagesMinimumPressDuration === nextAsyncMessagesMinimumPressDuration;
  if (!asyncMessagesMinimumPressDurationEqual) {
    return false;
  }

  const asyncMessagesSlideToCancelDistanceEqual =
    prevAsyncMessagesSlideToCancelDistance === nextAsyncMessagesSlideToCancelDistance;
  if (!asyncMessagesSlideToCancelDistanceEqual) {
    return false;
  }

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) {
    return false;
  }

  const imageUploadsEqual = prevImageUploads.length === nextImageUploads.length;
  if (!imageUploadsEqual) {
    return false;
  }

  const sendingEqual = prevSending.current === nextSending.current;
  if (!sendingEqual) {
    return false;
  }

  const showMoreOptionsEqual = prevShowMoreOptions === nextShowMoreOptions;
  if (!showMoreOptionsEqual) {
    return false;
  }

  const isOnlineEqual = prevIsOnline === nextIsOnline;
  if (!isOnlineEqual) {
    return false;
  }

  const isValidMessageEqual = prevIsValidMessage() === nextIsValidMessage();
  if (!isValidMessageEqual) {
    return false;
  }

  const asyncUploadsEqual = Object.keys(prevAsyncUploads).every(
    (key) =>
      prevAsyncUploads[key].state === nextAsyncUploads[key].state &&
      prevAsyncUploads[key].url === nextAsyncUploads[key].url,
  );
  if (!asyncUploadsEqual) {
    return false;
  }

  const fileUploadsEqual = prevFileUploads.length === nextFileUploads.length;
  if (!fileUploadsEqual) {
    return false;
  }

  const threadEqual =
    prevThread?.id === nextThread?.id &&
    prevThread?.text === nextThread?.text &&
    prevThread?.reply_count === nextThread?.reply_count;
  if (!threadEqual) {
    return false;
  }

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageInput = React.memo(
  MessageInputWithContext,
  areEqual,
) as typeof MessageInputWithContext;

export type MessageInputProps = Partial<MessageInputPropsWithContext>;

/**
 * UI Component for message input
 * It's a consumer of
 * [Channel Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/channel-context/),
 * [Chat Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/chat-context/),
 * [MessageInput Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/message-input-context/),
 * [Suggestions Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/suggestions-context/), and
 * [Translation Context](https://getstream.io/chat/docs/sdk/reactnative/contexts/translation-context/)
 */
export const MessageInput = (props: MessageInputProps) => {
  const { AttachmentPickerSelectionBar } = useAttachmentPickerContext();
  const { isOnline } = useChatContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const { channel, members, threadList, watchers } = useChannelContext();

  const {
    additionalTextInputProps,
    asyncIds,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesMultiSendEnabled,
    asyncMessagesSlideToCancelDistance,
    asyncUploads,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AudioRecordingWaveform,
    AutoCompleteSuggestionList,
    clearEditingState,
    closeAttachmentPicker,
    closePollCreationDialog,
    compressImageQuality,
    cooldownEndsAt,
    CooldownTimer,
    CreatePollContent,
    editing,
    FileUploadPreview,
    fileUploads,
    ImageUploadPreview,
    imageUploads,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    CommandInput,
    InputReplyStateHeader,
    isValidMessage,
    maxNumberOfFiles,
    numberOfUploads,
    openPollCreationDialog,
    removeFile,
    removeImage,
    resetInput,
    SendButton,
    sending,
    sendMessage,
    sendMessageAsync,
    SendMessageDisallowedIndicator,
    setShowMoreOptions,
    showMoreOptions,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    uploadNewFile,
    uploadNewImage,
  } = useMessageInputContext();

  const { Reply } = useMessagesContext();

  const { thread } = useThreadContext();

  const { t } = useTranslationContext();

  /**
   * Disable the message input if the channel is frozen, or the user doesn't have the capability to send a message.
   * Enable it in frozen mode, if it the input has editing state.
   */
  if (!ownCapabilities.sendMessage && !editing && SendMessageDisallowedIndicator) {
    return <SendMessageDisallowedIndicator />;
  }

  return (
    <MemoizedMessageInput
      {...{
        additionalTextInputProps,
        asyncIds,
        asyncMessagesLockDistance,
        asyncMessagesMinimumPressDuration,
        asyncMessagesMultiSendEnabled,
        asyncMessagesSlideToCancelDistance,
        asyncUploads,
        AttachmentPickerSelectionBar,
        AudioRecorder,
        audioRecordingEnabled,
        AudioRecordingInProgress,
        AudioRecordingLockIndicator,
        AudioRecordingPreview,
        AudioRecordingWaveform,
        AutoCompleteSuggestionList,
        channel,
        clearEditingState,
        closeAttachmentPicker,
        closePollCreationDialog,
        CommandInput,
        compressImageQuality,
        cooldownEndsAt,
        CooldownTimer,
        CreatePollContent,
        editing,
        FileUploadPreview,
        fileUploads,
        ImageUploadPreview,
        imageUploads,
        Input,
        inputBoxRef,
        InputButtons,
        InputEditingStateHeader,
        InputReplyStateHeader,
        isOnline,
        isValidMessage,
        maxNumberOfFiles,
        members,
        numberOfUploads,
        openPollCreationDialog,
        removeFile,
        removeImage,
        Reply,
        resetInput,
        SendButton,
        sending,
        sendMessage,
        sendMessageAsync,
        SendMessageDisallowedIndicator,
        setShowMoreOptions,
        showMoreOptions,
        showPollCreationDialog,
        ShowThreadMessageInChannelButton,
        StartAudioRecordingButton,
        StopMessageStreamingButton,
        t,
        thread,
        threadList,
        uploadNewFile,
        uploadNewImage,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
