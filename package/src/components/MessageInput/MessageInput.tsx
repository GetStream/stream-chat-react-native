import React, { useEffect } from 'react';
import { Modal, Platform, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { type MessageComposerState, type TextComposerState, type UserResponse } from 'stream-chat';

import { OutputButtons } from './components/OutputButtons';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useCountdown } from './hooks/useCountdown';

import {
  ChatContextValue,
  useAttachmentManagerState,
  useChatContext,
  useOwnCapabilitiesContext,
} from '../../contexts';
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
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { useKeyboardVisibility } from '../../hooks/useKeyboardVisibility';
import { useStateStore } from '../../hooks/useStateStore';
import { isAudioRecorderAvailable, NativeHandlers } from '../../native';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';
import { CreatePoll } from '../Poll/CreatePollContent';
import { SafeAreaViewWrapper } from '../UIComponents/SafeAreaViewWrapper';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  contentContainer: {
    gap: 4,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  floatingWrapper: {
    left: 0,
    paddingHorizontal: 24,
    position: 'absolute',
    right: 0,
  },
  inputBoxContainer: {
    flex: 1,
  },
  inputBoxWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
  },
  inputButtonsContainer: {
    alignSelf: 'flex-end',
  },
  inputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  micButtonContainer: {},
  outputButtonsContainer: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  shadow: {
    elevation: 6,

    shadowColor: 'hsla(0, 0%, 0%, 0.24)',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
  },
  suggestionsListContainer: {
    position: 'absolute',
    width: '100%',
  },
  wrapper: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});

type MessageInputPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'bottomInset' | 'disableAttachmentPicker' | 'selectedPicker'
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
    | 'CameraSelectorIcon'
    | 'CreatePollIcon'
    | 'FileSelectorIcon'
    | 'messageInputFloating'
    | 'messageInputHeightStore'
    | 'ImageSelectorIcon'
    | 'VideoRecorderSelectorIcon'
    | 'CommandInput'
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
  Pick<MessageComposerAPIContextValue, 'clearEditingState'> & {
    editing: boolean;
    hasAttachments: boolean;
    isKeyboardVisible: boolean;
    TextInputComponent?: React.ComponentType<
      TextInputProps & {
        ref: React.Ref<TextInput> | undefined;
      }
    >;
  };

const textComposerStateSelector = (state: TextComposerState) => ({
  command: state.command,
  mentionedUsers: state.mentionedUsers,
  suggestions: state.suggestions,
});

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const messageInputHeightStoreSelector = (state: MessageInputHeightState) => ({
  height: state.height,
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
    closeAttachmentPicker,
    closePollCreationDialog,
    cooldownEndsAt,
    CreatePollContent,
    disableAttachmentPicker,
    editing,
    hasAttachments,
    messageInputFloating,
    messageInputHeightStore,
    Input,
    inputBoxRef,
    InputButtons,
    CommandInput,
    isKeyboardVisible,
    isOnline,
    members,
    Reply,
    threadList,
    sendMessage,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    TextInputComponent,
    watchers,
  } = props;

  const messageComposer = useMessageComposer();
  const { clearEditingState } = useMessageComposerAPIContext();
  const onDismissEditMessage = () => {
    clearEditingState();
  };
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);

  const { height } = useStateStore(messageInputHeightStore.store, messageInputHeightStoreSelector);
  const {
    theme: {
      colors: { border, grey_whisper, white, white_smoke },
      messageInput: {
        attachmentSelectionBar,
        container,
        contentContainer,
        floatingWrapper,
        focusedInputBoxContainer,
        inputBoxContainer,
        inputBoxWrapper,
        inputContainer,
        inputButtonsContainer,
        inputFloatingContainer,
        micButtonContainer,
        outputButtonsContainer,
        suggestionsListContainer: { container: suggestionListContainer },
        wrapper,
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
    permissionsGranted,
    recording,
    recordingDuration,
    recordingStatus,
    setMicLocked,
    startVoiceRecording,
    stopVoiceRecording,
    uploadVoiceRecording,
    waveformData,
  } = useAudioRecorder();

  const asyncAudioEnabled = audioRecordingEnabled && isAudioRecorderAvailable();

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

  const BOTTOM_OFFSET = isKeyboardVisible ? 24 : Platform.OS === 'ios' ? 32 : 24;

  return (
    <>
      <Animated.View
        layout={LinearTransition.duration(200)}
        onLayout={({
          nativeEvent: {
            layout: { height: newHeight },
          },
        }) =>
          messageInputHeightStore.setHeight(
            messageInputFloating ? newHeight + BOTTOM_OFFSET : newHeight,
          )
        } // 24 is the position of the input from the bottom of the screen
        style={
          messageInputFloating
            ? [styles.floatingWrapper, { bottom: BOTTOM_OFFSET }, floatingWrapper]
            : [
                styles.wrapper,
                {
                  backgroundColor: white,
                  borderColor: border.surfaceSubtle,
                  paddingBottom: BOTTOM_OFFSET,
                },
                wrapper,
              ]
        }
      >
        {recording && (
          <>
            <AudioRecordingLockIndicator
              messageInputHeight={height}
              micLocked={micLocked}
              style={lockIndicatorAnimatedStyle}
            />
            {recordingStatus === 'stopped' ? (
              <AudioRecordingPreview
                recordingDuration={recordingDuration}
                uri={
                  typeof recording !== 'string'
                    ? (recording?.getURI() as string)
                    : (recording as string)
                }
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

        <View style={[styles.container, container]}>
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
                  <View
                    style={[
                      styles.inputButtonsContainer,
                      messageInputFloating ? styles.shadow : null,
                      inputButtonsContainer,
                    ]}
                  >
                    {InputButtons && <InputButtons />}
                  </View>
                  <Animated.View
                    layout={LinearTransition.duration(200)}
                    style={[
                      styles.inputBoxWrapper,
                      {
                        backgroundColor: white,
                        borderColor: grey_whisper,
                      },
                      messageInputFloating ? [styles.shadow, inputFloatingContainer] : null,
                      inputBoxWrapper,
                      isFocused ? focusedInputBoxContainer : null,
                    ]}
                  >
                    <View style={[styles.inputBoxContainer, inputBoxContainer]}>
                      <View
                        style={[
                          styles.contentContainer,
                          {
                            paddingTop: hasAttachments || quotedMessage || editing ? 8 : 0,
                          },
                          contentContainer,
                        ]}
                      >
                        {editing ? (
                          <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(200)}
                          >
                            <Reply
                              mode='edit'
                              onDismiss={onDismissEditMessage}
                              quotedMessage={messageComposer.editedMessage}
                            />
                          </Animated.View>
                        ) : null}
                        {quotedMessage ? (
                          <Animated.View
                            entering={FadeIn.duration(200)}
                            exiting={FadeOut.duration(200)}
                          >
                            <Reply mode='reply' />
                          </Animated.View>
                        ) : null}
                        <AttachmentUploadPreviewList />
                      </View>

                      <View style={[styles.inputContainer, inputContainer]}>
                        {command ? (
                          <CommandInput disabled={!isOnline} />
                        ) : (
                          <AutoCompleteInput
                            cooldownRemainingSeconds={cooldownRemainingSeconds}
                            TextInputComponent={TextInputComponent}
                            {...additionalTextInputProps}
                          />
                        )}

                        <View style={[styles.outputButtonsContainer, outputButtonsContainer]}>
                          <OutputButtons />
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                </>
              )}

              {asyncAudioEnabled && !micLocked ? (
                <GestureDetector gesture={panGestureMic}>
                  <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(200)}>
                    <Animated.View
                      style={[
                        styles.micButtonContainer,
                        micButttonAnimatedStyle,
                        micButtonContainer,
                      ]}
                    >
                      <StartAudioRecordingButton
                        permissionsGranted={permissionsGranted}
                        recording={recording}
                        startVoiceRecording={startVoiceRecording}
                      />
                    </Animated.View>
                  </Animated.View>
                </GestureDetector>
              ) : null}
            </>
          )}
        </View>
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={LinearTransition.duration(200)}
        style={[styles.suggestionsListContainer, { bottom: height }, suggestionListContainer]}
      >
        <AutoCompleteSuggestionList />
      </Animated.View>
      {!disableAttachmentPicker && selectedPicker ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
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
        </Animated.View>
      ) : null}

      {showPollCreationDialog ? (
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Modal
            animationType='slide'
            onRequestClose={closePollCreationDialog}
            visible={showPollCreationDialog}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <SafeAreaViewWrapper style={{ flex: 1 }}>
                <CreatePoll
                  closePollCreationDialog={closePollCreationDialog}
                  CreatePollContent={CreatePollContent}
                  sendMessage={sendMessage}
                />
              </SafeAreaViewWrapper>
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
    hasAttachments: prevHasAttachments,
    isKeyboardVisible: prevIsKeyboardVisible,
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
    isKeyboardVisible: nextIsKeyboardVisible,
    isOnline: nextIsOnline,
    hasAttachments: nextHasAttachments,
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

  const hasAttachmentsEqual = prevHasAttachments === nextHasAttachments;
  if (!hasAttachmentsEqual) {
    return false;
  }

  const isKeyboardVisibleEqual = prevIsKeyboardVisible === nextIsKeyboardVisible;
  if (!isKeyboardVisibleEqual) {
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
    CommandInput,
    messageInputFloating,
    messageInputHeightStore,
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
  const { bottomInset, bottomSheetRef, disableAttachmentPicker, selectedPicker } =
    useAttachmentPickerContext();
  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { clearEditingState } = useMessageComposerAPIContext();

  const { Reply } = useMessagesContext();
  const { attachments } = useAttachmentManagerState();
  const isKeyboardVisible = useKeyboardVisibility();

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
        disableAttachmentPicker,
        editing,
        FileSelectorIcon,
        hasAttachments: attachments.length > 0,
        ImageSelectorIcon,
        Input,
        inputBoxRef,
        InputButtons,
        isKeyboardVisible,
        isOnline,
        members,
        messageInputFloating,
        messageInputHeightStore,
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
