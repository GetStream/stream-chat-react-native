import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

import { type MessageComposerState, type TextComposerState, type UserResponse } from 'stream-chat';

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
import {
  MessageComposerAPIContextValue,
  useMessageComposerAPIContext,
} from '../../contexts/messageComposerContext/MessageComposerAPIContext';
import { useAttachmentManagerState } from '../../contexts/messageInputContext/hooks/useAttachmentManagerState';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useMessageComposerHasSendableData } from '../../contexts/messageInputContext/hooks/useMessageComposerHasSendableData';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
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
  'bottomInset' | 'selectedPicker'
> &
  Pick<ChatContextValue, 'isOnline'> &
  Pick<ChannelContextValue, 'channel' | 'members' | 'threadList' | 'watchers'> &
  Pick<
    MessageInputContextValue,
    | 'additionalTextInputProps'
    | 'audioRecordingEnabled'
    | 'asyncMessagesLockDistance'
    | 'asyncMessagesMinimumPressDuration'
    | 'asyncMessagesSlideToCancelDistance'
    | 'asyncMessagesMultiSendEnabled'
    | 'attachmentPickerBottomSheetHeight'
    | 'AttachmentPickerSelectionBar'
    | 'attachmentSelectionBarHeight'
    | 'AttachmentUploadPreviewList'
    | 'AudioRecorder'
    | 'AudioRecordingInProgress'
    | 'AudioRecordingLockIndicator'
    | 'AudioRecordingPreview'
    | 'AutoCompleteSuggestionList'
    | 'cooldownEndsAt'
    | 'CooldownTimer'
    | 'closeAttachmentPicker'
    | 'compressImageQuality'
    | 'Input'
    | 'inputBoxRef'
    | 'InputButtons'
    | 'InputEditingStateHeader'
    | 'CameraSelectorIcon'
    | 'CreatePollIcon'
    | 'FileSelectorIcon'
    | 'ImageSelectorIcon'
    | 'VideoRecorderSelectorIcon'
    | 'CommandInput'
    | 'InputReplyStateHeader'
    | 'SendButton'
    | 'ShowThreadMessageInChannelButton'
    | 'StartAudioRecordingButton'
    | 'uploadNewFile'
    | 'openPollCreationDialog'
    | 'closePollCreationDialog'
    | 'showPollCreationDialog'
    | 'sendMessage'
    | 'CreatePollContent'
    | 'StopMessageStreamingButton'
  > &
  Pick<MessagesContextValue, 'Reply'> &
  Pick<TranslationContextValue, 't'> &
  Pick<MessageComposerAPIContextValue, 'clearEditingState'> & { editing: boolean };

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  hasText: !!state.text,
  mentionedUsers: state.mentionedUsers,
  suggestions: state.suggestions,
});

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const MessageInputWithContext = (props: MessageInputPropsWithContext) => {
  const {
    AttachmentPickerSelectionBar,
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    bottomInset,
    selectedPicker,

    additionalTextInputProps,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesMultiSendEnabled,
    asyncMessagesSlideToCancelDistance,
    AttachmentUploadPreviewList,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AutoCompleteSuggestionList,
    channel,
    closeAttachmentPicker,
    closePollCreationDialog,
    cooldownEndsAt,
    CooldownTimer,
    CreatePollContent,
    editing,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    CommandInput,
    InputReplyStateHeader,
    isOnline,
    members,
    Reply,
    threadList,
    SendButton,
    sendMessage,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    watchers,
  } = props;

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { command, hasText } = useStateStore(textComposer.state, textComposerStateSelector);
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);
  const { attachments } = useAttachmentManagerState();
  const hasSendableData = useMessageComposerHasSendableData();

  const [height, setHeight] = useState(0);

  const {
    theme: {
      colors: { border, grey_whisper, white, white_smoke },
      messageInput: {
        attachmentSelectionBar,
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

  const { seconds: cooldownRemainingSeconds } = useCountdown(cooldownEndsAt);

  // Close the attachment picker state when the component unmounts
  useEffect(
    () => () => {
      closeAttachmentPicker();
    },
    [closeAttachmentPicker],
  );

  useEffect(() => {
    if (editing && inputBoxRef.current) {
      inputBoxRef.current.focus();
    }
  }, [editing, inputBoxRef]);

  /**
   * Effect to get the draft data for legacy thread composer and set it to message composer.
   * TODO: This can be removed once we remove legacy thread composer.
   */
  useEffect(() => {
    const threadId = messageComposer.threadId;
    if (!threadId) return;

    messageComposer.getDraft();
  }, [messageComposer]);

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

  const asyncAudioEnabled = audioRecordingEnabled && isAudioRecorderAvailable();
  const showSendingButton = hasText || attachments.length || command;

  const isSendingButtonVisible = useMemo(() => {
    return asyncAudioEnabled ? showSendingButton && !recording : true;
  }, [asyncAudioEnabled, recording, showSendingButton]);

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

  const lockIndicatorAnimatedStyle = useAnimatedStyle(() => ({
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
  }));
  const micButttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(micPositionX.value, [0, X_AXIS_POSITION], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: micPositionX.value }, { translateY: micPositionY.value }],
  }));
  const slideToCancelAnimatedStyle = useAnimatedStyle(() => ({
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
  }));

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
              style={lockIndicatorAnimatedStyle}
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
                  slideToCancelStyle={slideToCancelAnimatedStyle}
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
                    <AttachmentUploadPreviewList />
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
              ) : isSendingButtonVisible ? (
                cooldownRemainingSeconds ? (
                  <CooldownTimer seconds={cooldownRemainingSeconds} />
                ) : (
                  <View style={[styles.sendButtonContainer, sendButtonContainer]}>
                    <SendButton disabled={!hasSendableData || (!!command && !isOnline)} />
                  </View>
                )
              ) : null}
              {audioRecordingEnabled && isAudioRecorderAvailable() && !micLocked && (
                <GestureDetector gesture={panGestureMic}>
                  <Animated.View
                    style={[styles.micButtonContainer, micButttonAnimatedStyle, micButtonContainer]}
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
      {isImageMediaLibraryAvailable() && selectedPicker ? (
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
      ) : null}

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
    audioRecordingEnabled: prevAsyncMessagesEnabled,
    channel: prevChannel,
    closePollCreationDialog: prevClosePollCreationDialog,
    cooldownEndsAt: prevCooldownEndsAt,
    editing: prevEditing,
    isOnline: prevIsOnline,
    openPollCreationDialog: prevOpenPollCreationDialog,
    selectedPicker: prevSelectedPicker,
    showPollCreationDialog: prevShowPollCreationDialog,
    t: prevT,
    threadList: prevThreadList,
  } = prevProps;
  const {
    additionalTextInputProps: nextAdditionalTextInputProps,
    asyncMessagesLockDistance: nextAsyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration: nextAsyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance: nextAsyncMessagesSlideToCancelDistance,
    audioRecordingEnabled: nextAsyncMessagesEnabled,
    channel: nextChannel,
    closePollCreationDialog: nextClosePollCreationDialog,
    cooldownEndsAt: nextCooldownEndsAt,
    editing: nextEditing,
    isOnline: nextIsOnline,
    openPollCreationDialog: nextOpenPollCreationDialog,
    selectedPicker: nextSelectedPicker,
    showPollCreationDialog: nextShowPollCreationDialog,
    t: nextT,
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

  const isOnlineEqual = prevIsOnline === nextIsOnline;
  if (!isOnlineEqual) {
    return false;
  }

  const cooldownEndsAtEqual = prevCooldownEndsAt === nextCooldownEndsAt;
  if (!cooldownEndsAtEqual) {
    return false;
  }

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const selectedPickerEqual = prevSelectedPicker === nextSelectedPicker;
  if (!selectedPickerEqual) {
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
  const { isOnline } = useChatContext();
  const ownCapabilities = useOwnCapabilitiesContext();

  const { channel, members, threadList, watchers } = useChannelContext();

  const {
    additionalTextInputProps,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesMultiSendEnabled,
    asyncMessagesSlideToCancelDistance,
    AttachmentPickerBottomSheetHandle,
    attachmentPickerBottomSheetHandleHeight,
    attachmentPickerBottomSheetHeight,
    AttachmentPickerSelectionBar,
    attachmentSelectionBarHeight,
    AttachmentUploadPreviewList,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AudioRecordingWaveform,
    AutoCompleteSuggestionList,
    CameraSelectorIcon,
    closeAttachmentPicker,
    closePollCreationDialog,
    compressImageQuality,
    cooldownEndsAt,
    CooldownTimer,
    CreatePollContent,
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    Input,
    inputBoxRef,
    InputButtons,
    InputEditingStateHeader,
    CommandInput,
    InputReplyStateHeader,
    openPollCreationDialog,
    SendButton,
    sendMessage,
    SendMessageDisallowedIndicator,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    uploadNewFile,
    VideoRecorderSelectorIcon,
  } = useMessageInputContext();
  const { bottomInset, bottomSheetRef, selectedPicker } = useAttachmentPickerContext();
  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { clearEditingState } = useMessageComposerAPIContext();

  const { Reply } = useMessagesContext();

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
        asyncMessagesLockDistance,
        asyncMessagesMinimumPressDuration,
        asyncMessagesMultiSendEnabled,
        asyncMessagesSlideToCancelDistance,
        AttachmentPickerBottomSheetHandle,
        attachmentPickerBottomSheetHandleHeight,
        attachmentPickerBottomSheetHeight,
        AttachmentPickerSelectionBar,
        attachmentSelectionBarHeight,
        AttachmentUploadPreviewList,
        AudioRecorder,
        audioRecordingEnabled,
        AudioRecordingInProgress,
        AudioRecordingLockIndicator,
        AudioRecordingPreview,
        AudioRecordingWaveform,
        AutoCompleteSuggestionList,
        bottomInset,
        bottomSheetRef,
        CameraSelectorIcon,
        channel,
        clearEditingState,
        closeAttachmentPicker,
        closePollCreationDialog,
        CommandInput,
        compressImageQuality,
        cooldownEndsAt,
        CooldownTimer,
        CreatePollContent,
        CreatePollIcon,
        editing,
        FileSelectorIcon,
        ImageSelectorIcon,
        Input,
        inputBoxRef,
        InputButtons,
        InputEditingStateHeader,
        InputReplyStateHeader,
        isOnline,
        members,
        openPollCreationDialog,
        Reply,
        selectedPicker,
        SendButton,
        sendMessage,
        SendMessageDisallowedIndicator,
        showPollCreationDialog,
        ShowThreadMessageInChannelButton,
        StartAudioRecordingButton,
        StopMessageStreamingButton,
        t,
        threadList,
        uploadNewFile,
        VideoRecorderSelectorIcon,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
