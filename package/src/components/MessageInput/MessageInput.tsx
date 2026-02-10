import React, { useEffect, useMemo } from 'react';
import { Modal, StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type MessageComposerState, type TextComposerState, type UserResponse } from 'stream-chat';

import { LinkPreviewList } from './components/LinkPreviewList';
import { OutputButtons } from './components/OutputButtons';

import { useHasLinkPreviews } from './hooks/useLinkPreviews';

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
import { AudioRecorderManagerState } from '../../state-store/audio-recorder-manager';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import { AutoCompleteInput } from '../AutoCompleteInput/AutoCompleteInput';
import { CreatePoll } from '../Poll/CreatePollContent';
import { GiphyChip } from '../ui/GiphyChip';
import { SafeAreaViewWrapper } from '../UIComponents/SafeAreaViewWrapper';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXs,
        justifyContent: 'space-between',
      },
      contentContainer: {
        gap: primitives.spacingXxs,
        overflow: 'hidden',
        paddingHorizontal: primitives.spacingXs,
      },
      floatingWrapper: {
        left: 0,
        position: 'absolute',
        right: 0,
      },
      giphyContainer: {
        padding: primitives.spacingXs,
      },
      inputBoxContainer: {
        flex: 1,
      },
      inputBoxWrapper: {
        borderRadius: 24,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        backgroundColor: semantics.composerBg,
        borderColor: semantics.borderCoreDefault,
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
        padding: primitives.spacingXs,
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
        paddingHorizontal: primitives.spacingMd,
        paddingTop: primitives.spacingMd,
      },
      audioLockIndicatorWrapper: {
        position: 'absolute',
        right: primitives.spacingMd,
        padding: 4,
      },
    });
  }, [semantics]);
};

type MessageInputPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'bottomInset' | 'disableAttachmentPicker' | 'selectedPicker'
> &
  Pick<ChatContextValue, 'isOnline'> &
  Pick<ChannelContextValue, 'channel' | 'members' | 'threadList' | 'watchers'> &
  Pick<
    MessageInputContextValue,
    | 'audioRecorderManager'
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
  Pick<MessageComposerAPIContextValue, 'clearEditingState'> &
  Pick<AudioRecorderManagerState, 'micLocked'> & {
    editing: boolean;
    hasAttachments: boolean;
    isKeyboardVisible: boolean;
    TextInputComponent?: React.ComponentType<
      TextInputProps & {
        ref: React.Ref<TextInput> | undefined;
      }
    >;
    isRecordingStateIdle?: boolean;
    recordingStatus?: string;
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
    asyncMessagesSlideToCancelDistance,
    AttachmentUploadPreviewList,
    AudioRecorder,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AutoCompleteSuggestionList,
    closeAttachmentPicker,
    closePollCreationDialog,
    CreatePollContent,
    disableAttachmentPicker,
    editing,
    hasAttachments,
    messageInputFloating,
    messageInputHeightStore,
    Input,
    inputBoxRef,
    InputButtons,
    isKeyboardVisible,
    members,
    Reply,
    threadList,
    sendMessage,
    showPollCreationDialog,
    ShowThreadMessageInChannelButton,
    TextInputComponent,
    watchers,
    micLocked,
    isRecordingStateIdle,
    recordingStatus,
  } = props;

  const styles = useStyles();
  const messageComposer = useMessageComposer();
  const { clearEditingState } = useMessageComposerAPIContext();
  const onDismissEditMessage = () => {
    clearEditingState();
  };
  const { textComposer } = messageComposer;
  const { command } = useStateStore(textComposer.state, textComposerStateSelector);
  const { quotedMessage } = useStateStore(messageComposer.state, messageComposerStateStoreSelector);

  const { height } = useStateStore(messageInputHeightStore.store, messageInputHeightStoreSelector);

  const hasLinkPreviews = useHasLinkPreviews();

  const {
    theme: {
      semantics,
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
        outputButtonsContainer,
        suggestionsListContainer: { container: suggestionListContainer },
        wrapper,
      },
    },
  } = useTheme();

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

  const micPositionX = useSharedValue(0);
  const micPositionY = useSharedValue(0);
  const X_AXIS_POSITION = -asyncMessagesSlideToCancelDistance;
  const Y_AXIS_POSITION = -asyncMessagesLockDistance;

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
  const slideToCancelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(micPositionX.value, [0, X_AXIS_POSITION], [1, 0], Extrapolation.CLAMP),
  }));
  const { bottom } = useSafeAreaInsets();

  const BOTTOM_OFFSET = isKeyboardVisible ? 16 : bottom ? bottom : 16;

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
        } // BOTTOM OFFSET is the position of the input from the bottom of the screen
        style={
          messageInputFloating
            ? [styles.wrapper, styles.floatingWrapper, { bottom: BOTTOM_OFFSET }, floatingWrapper]
            : [
                styles.wrapper,
                {
                  borderTopWidth: 1,
                  backgroundColor: semantics.composerBg,
                  borderColor: semantics.borderCoreDefault,
                  paddingBottom: BOTTOM_OFFSET,
                },
                wrapper,
              ]
        }
      >
        {Input ? (
          <Input additionalTextInputProps={additionalTextInputProps} getUsers={getUsers} />
        ) : (
          <View style={[styles.container, container]}>
            {isRecordingStateIdle ? (
              <Animated.View
                layout={LinearTransition.duration(200)}
                style={[
                  styles.inputButtonsContainer,
                  messageInputFloating ? styles.shadow : null,
                  inputButtonsContainer,
                ]}
              >
                {InputButtons && <InputButtons />}
              </Animated.View>
            ) : null}
            <Animated.View
              layout={LinearTransition.duration(200)}
              style={[
                styles.inputBoxWrapper,
                messageInputFloating ? [styles.shadow, inputFloatingContainer] : null,
                inputBoxWrapper,
                isFocused ? focusedInputBoxContainer : null,
              ]}
            >
              <View style={[styles.inputBoxContainer, inputBoxContainer]}>
                {recordingStatus === 'stopped' ? (
                  <AudioRecordingPreview />
                ) : micLocked ? (
                  <AudioRecordingInProgress />
                ) : null}
                {isRecordingStateIdle ? (
                  <Animated.View
                    layout={LinearTransition.duration(200)}
                    style={[
                      styles.contentContainer,
                      {
                        paddingTop:
                          hasAttachments || quotedMessage || editing || hasLinkPreviews
                            ? primitives.spacingXs
                            : 0,
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
                    <LinkPreviewList />
                  </Animated.View>
                ) : null}

                <Animated.View
                  style={[styles.inputContainer, inputContainer]}
                  layout={LinearTransition.duration(200)}
                >
                  {!isRecordingStateIdle ? (
                    <AudioRecorder slideToCancelStyle={slideToCancelAnimatedStyle} />
                  ) : (
                    <>
                      {command ? (
                        <View style={styles.giphyContainer}>
                          <GiphyChip />
                        </View>
                      ) : null}

                      <AutoCompleteInput
                        TextInputComponent={TextInputComponent}
                        {...additionalTextInputProps}
                      />
                    </>
                  )}

                  {(recordingStatus === 'idle' || recordingStatus === 'recording') && !micLocked ? (
                    <View style={[styles.outputButtonsContainer, outputButtonsContainer]}>
                      <OutputButtons micPositionX={micPositionX} micPositionY={micPositionY} />
                    </View>
                  ) : null}
                </Animated.View>
              </View>
            </Animated.View>
          </View>
        )}
        <ShowThreadMessageInChannelButton threadList={threadList} />
      </Animated.View>

      {!isRecordingStateIdle ? (
        <View
          style={[
            styles.audioLockIndicatorWrapper,
            {
              bottom: messageInputFloating ? 0 : 16,
            },
          ]}
        >
          <AudioRecordingLockIndicator
            messageInputHeight={height}
            micLocked={micLocked}
            style={lockIndicatorAnimatedStyle}
          />
        </View>
      ) : null}

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
              backgroundColor: semantics.composerBg,
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
    editing: prevEditing,
    hasAttachments: prevHasAttachments,
    isKeyboardVisible: prevIsKeyboardVisible,
    isOnline: prevIsOnline,
    openPollCreationDialog: prevOpenPollCreationDialog,
    selectedPicker: prevSelectedPicker,
    showPollCreationDialog: prevShowPollCreationDialog,
    t: prevT,
    threadList: prevThreadList,
    micLocked: prevMicLocked,
    isRecordingStateIdle: prevIsRecordingStateIdle,
    recordingStatus: prevRecordingStatus,
  } = prevProps;
  const {
    additionalTextInputProps: nextAdditionalTextInputProps,
    asyncMessagesLockDistance: nextAsyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration: nextAsyncMessagesMinimumPressDuration,
    asyncMessagesSlideToCancelDistance: nextAsyncMessagesSlideToCancelDistance,
    audioRecordingEnabled: nextAsyncMessagesEnabled,
    channel: nextChannel,
    closePollCreationDialog: nextClosePollCreationDialog,
    editing: nextEditing,
    isKeyboardVisible: nextIsKeyboardVisible,
    isOnline: nextIsOnline,
    hasAttachments: nextHasAttachments,
    openPollCreationDialog: nextOpenPollCreationDialog,
    selectedPicker: nextSelectedPicker,
    showPollCreationDialog: nextShowPollCreationDialog,
    t: nextT,
    threadList: nextThreadList,
    micLocked: nextMicLocked,
    isRecordingStateIdle: nextIsRecordingStateIdle,
    recordingStatus: nextRecordingStatus,
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

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) {
    return false;
  }

  const selectedPickerEqual = prevSelectedPicker === nextSelectedPicker;
  if (!selectedPickerEqual) {
    return false;
  }

  const micLockedEqual = prevMicLocked === nextMicLocked;
  if (!micLockedEqual) {
    return false;
  }

  const isRecordingStateIdleEqual = prevIsRecordingStateIdle === nextIsRecordingStateIdle;
  if (!isRecordingStateIdleEqual) {
    return false;
  }

  const recordingStatusEqual = prevRecordingStatus === nextRecordingStatus;
  if (!recordingStatusEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageInput = React.memo(
  MessageInputWithContext,
  areEqual,
) as typeof MessageInputWithContext;

export type MessageInputProps = Partial<MessageInputPropsWithContext>;

const audioRecorderSelector = (state: AudioRecorderManagerState) => ({
  micLocked: state.micLocked,
  isRecordingStateIdle: state.status === 'idle',
  recordingStatus: state.status,
});

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
    audioRecorderManager,
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
    CreatePollContent,
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    Input,
    inputBoxRef,
    InputButtons,
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

  const { micLocked, isRecordingStateIdle, recordingStatus } = useStateStore(
    audioRecorderManager.state,
    audioRecorderSelector,
  );

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
        audioRecorderManager,
        isRecordingStateIdle,
        recordingStatus,
        micLocked,
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
        compressImageQuality,
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
