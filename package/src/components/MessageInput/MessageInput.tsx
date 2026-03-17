import React, { useEffect, useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type UserResponse } from 'stream-chat';

import { MicPositionProvider } from './contexts/MicPositionContext';

import { audioRecorderSelector } from './utils/audioRecorderSelectors';

import {
  ChatContextValue,
  useAttachmentPickerContext,
  useChatContext,
  useOwnCapabilitiesContext,
} from '../../contexts';
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

import { useAttachmentPickerState } from '../../hooks/useAttachmentPickerState';
import { useKeyboardVisibility } from '../../hooks/useKeyboardVisibility';
import { useStateStore } from '../../hooks/useStateStore';
import { AudioRecorderManagerState } from '../../state-store/audio-recorder-manager';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import { type TextInputOverrideComponent } from '../AutoCompleteInput/AutoCompleteInput';
import { CreatePoll } from '../Poll/CreatePollContent';
import { PortalWhileClosingView } from '../UIComponents/PortalWhileClosingView';
import { SafeAreaViewWrapper } from '../UIComponents/SafeAreaViewWrapper';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      autocompleteInputContainer: {
        flex: 1,
        flexShrink: 1,
        minWidth: 0,
      },
      pollModalWrapper: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        backgroundColor: semantics.backgroundCoreElevation1,
      },
      pollSafeArea: {
        flex: 1,
        backgroundColor: semantics.backgroundCoreElevation1,
      },
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
        backgroundColor: semantics.backgroundCoreElevation1,
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
        backgroundColor: semantics.backgroundCoreElevation1,
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

type MessageInputPropsWithContext = Pick<ChatContextValue, 'isOnline'> &
  Pick<ChannelContextValue, 'channel' | 'members' | 'watchers'> &
  Pick<
    MessageInputContextValue,
    | 'audioRecorderManager'
    | 'additionalTextInputProps'
    | 'audioRecordingEnabled'
    | 'asyncMessagesLockDistance'
    | 'asyncMessagesMinimumPressDuration'
    | 'asyncMessagesSlideToCancelDistance'
    | 'asyncMessagesMultiSendEnabled'
    | 'AttachmentUploadPreviewList'
    | 'AudioRecorder'
    | 'AudioRecordingInProgress'
    | 'AudioRecordingLockIndicator'
    | 'AudioRecordingPreview'
    | 'AutoCompleteSuggestionList'
    | 'closeAttachmentPicker'
    | 'compressImageQuality'
    | 'Input'
    | 'InputView'
    | 'inputBoxRef'
    | 'InputButtons'
    | 'MessageComposerLeadingView'
    | 'MessageComposerTrailingView'
    | 'messageInputFloating'
    | 'messageInputHeightStore'
    | 'MessageInputHeaderView'
    | 'MessageInputTrailingView'
    | 'SendButton'
    | 'StartAudioRecordingButton'
    | 'uploadNewFile'
    | 'openPollCreationDialog'
    | 'closePollCreationDialog'
    | 'showPollCreationDialog'
    | 'sendMessage'
    | 'CreatePollContent'
    | 'createPollOptionGap'
    | 'StopMessageStreamingButton'
  > &
  Pick<MessagesContextValue, 'Reply'> &
  Pick<TranslationContextValue, 't'> &
  Pick<MessageComposerAPIContextValue, 'clearEditingState'> &
  Pick<AudioRecorderManagerState, 'micLocked'> & {
    editing: boolean;
    isKeyboardVisible: boolean;
    threadList?: boolean;
    TextInputComponent?: TextInputOverrideComponent;
    isRecordingStateIdle?: boolean;
    recordingStatus?: string;
  };

const messageInputHeightStoreSelector = (state: MessageInputHeightState) => ({
  height: state.height,
});

const MessageInputWithContext = (props: MessageInputPropsWithContext) => {
  const {
    additionalTextInputProps,
    asyncMessagesLockDistance,
    asyncMessagesSlideToCancelDistance,
    AudioRecorder,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AutoCompleteSuggestionList,
    closeAttachmentPicker,
    closePollCreationDialog,
    CreatePollContent,
    createPollOptionGap,
    editing,
    InputView,
    MessageComposerLeadingView,
    MessageComposerTrailingView,
    messageInputFloating,
    messageInputHeightStore,
    MessageInputHeaderView,
    MessageInputTrailingView,
    Input,
    inputBoxRef,
    isKeyboardVisible,
    members,
    sendMessage,
    showPollCreationDialog,
    TextInputComponent,
    watchers,
    micLocked,
    isRecordingStateIdle,
    recordingStatus,
  } = props;

  const styles = useStyles();
  const { selectedPicker } = useAttachmentPickerState();
  const { attachmentPickerBottomSheetHeight, bottomInset } = useAttachmentPickerContext();
  const messageComposer = useMessageComposer();

  const { height } = useStateStore(messageInputHeightStore.store, messageInputHeightStoreSelector);

  const {
    theme: {
      semantics,
      messageInput: {
        container,
        floatingWrapper,
        focusedInputBoxContainer,
        inputBoxContainer,
        inputBoxWrapper,
        inputContainer,
        inputFloatingContainer,
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

  const BOTTOM_OFFSET = isKeyboardVisible || selectedPicker ? 16 : bottom ? bottom : 16;

  const micPositionContextValue = useMemo(
    () => ({ micPositionX, micPositionY }),
    [micPositionX, micPositionY],
  );
  return (
    <MicPositionProvider value={micPositionContextValue}>
      {messageInputFloating ? (
        <View
          style={{
            paddingBottom:
              selectedPicker && !isKeyboardVisible
                ? attachmentPickerBottomSheetHeight - bottomInset + 16
                : 16,
          }}
        />
      ) : null}
      <Animated.View
        style={
          messageInputFloating
            ? [
                styles.floatingWrapper,
                {
                  bottom:
                    selectedPicker && !isKeyboardVisible
                      ? attachmentPickerBottomSheetHeight - bottomInset + BOTTOM_OFFSET
                      : BOTTOM_OFFSET,
                },
                floatingWrapper,
              ]
            : null
        }
        layout={LinearTransition.duration(200)}
      >
        <PortalWhileClosingView
          portalHostName='overlay-composer'
          portalName='message-input-composer'
        >
          <View
            onLayout={({
              nativeEvent: {
                layout: { height: newHeight },
              },
            }) => {
              messageInputHeightStore.setHeight(newHeight);
            }}
            style={
              messageInputFloating
                ? [styles.wrapper]
                : [
                    styles.wrapper,
                    {
                      borderTopWidth: 1,
                      backgroundColor: semantics.backgroundCoreElevation1,
                      borderColor: semantics.borderCoreDefault,
                      // paddingBottom: BOTTOM_OFFSET,
                      paddingBottom:
                        selectedPicker && !isKeyboardVisible
                          ? attachmentPickerBottomSheetHeight - bottomInset + BOTTOM_OFFSET
                          : BOTTOM_OFFSET,
                    },
                    wrapper,
                  ]
            }
          >
            {Input ? (
              <Input additionalTextInputProps={additionalTextInputProps} getUsers={getUsers} />
            ) : (
              <View style={[styles.container, container]}>
                <MessageComposerLeadingView />
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

                    <MessageInputHeaderView />

                    <Animated.View
                      style={[styles.inputContainer, inputContainer]}
                      layout={LinearTransition.duration(200)}
                    >
                      {!isRecordingStateIdle ? (
                        <AudioRecorder slideToCancelStyle={slideToCancelAnimatedStyle} />
                      ) : (
                        <InputView
                          TextInputComponent={TextInputComponent}
                          {...additionalTextInputProps}
                        />
                      )}

                      <MessageInputTrailingView />
                    </Animated.View>
                  </View>
                </Animated.View>
              </View>
            )}
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
            ) : (
              <MessageComposerTrailingView />
            )}
          </View>
          <View
            style={[styles.suggestionsListContainer, { bottom: height }, suggestionListContainer]}
          >
            <AutoCompleteSuggestionList />
          </View>
        </PortalWhileClosingView>
      </Animated.View>

      {showPollCreationDialog ? (
        <View style={styles.pollModalWrapper}>
          <Modal
            animationType='slide'
            onRequestClose={closePollCreationDialog}
            visible={showPollCreationDialog}
          >
            <GestureHandlerRootView style={styles.pollSafeArea}>
              <SafeAreaViewWrapper style={styles.pollSafeArea}>
                <CreatePoll
                  closePollCreationDialog={closePollCreationDialog}
                  CreatePollContent={CreatePollContent}
                  createPollOptionGap={createPollOptionGap}
                  sendMessage={sendMessage}
                />
              </SafeAreaViewWrapper>
            </GestureHandlerRootView>
          </Modal>
        </View>
      ) : null}
    </MicPositionProvider>
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
    createPollOptionGap: prevCreatePollOptionGap,
    editing: prevEditing,
    isKeyboardVisible: prevIsKeyboardVisible,
    isOnline: prevIsOnline,
    openPollCreationDialog: prevOpenPollCreationDialog,
    showPollCreationDialog: prevShowPollCreationDialog,
    t: prevT,
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
    createPollOptionGap: nextCreatePollOptionGap,
    editing: nextEditing,
    isKeyboardVisible: nextIsKeyboardVisible,
    isOnline: nextIsOnline,
    openPollCreationDialog: nextOpenPollCreationDialog,
    showPollCreationDialog: nextShowPollCreationDialog,
    t: nextT,
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
    prevCreatePollOptionGap === nextCreatePollOptionGap &&
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

  const isKeyboardVisibleEqual = prevIsKeyboardVisible === nextIsKeyboardVisible;
  if (!isKeyboardVisibleEqual) {
    return false;
  }

  const isOnlineEqual = prevIsOnline === nextIsOnline;
  if (!isOnlineEqual) {
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

  const { channel, members, watchers } = useChannelContext();

  const {
    audioRecorderManager,
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
    AudioRecordingWaveform,
    AutoCompleteSuggestionList,
    closeAttachmentPicker,
    closePollCreationDialog,
    compressImageQuality,
    CreatePollContent,
    Input,
    InputView,
    inputBoxRef,
    InputButtons,
    MessageComposerLeadingView,
    MessageComposerTrailingView,
    messageInputFloating,
    messageInputHeightStore,
    MessageInputHeaderView,
    MessageInputTrailingView,
    openPollCreationDialog,
    SendButton,
    sendMessage,
    SendMessageDisallowedIndicator,
    showPollCreationDialog,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    uploadNewFile,
  } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const editing = !!messageComposer.editedMessage;
  const { clearEditingState } = useMessageComposerAPIContext();

  const { Reply } = useMessagesContext();
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
        AttachmentUploadPreviewList,
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
        compressImageQuality,
        CreatePollContent,
        editing,
        Input,
        InputView,
        inputBoxRef,
        InputButtons,
        MessageComposerLeadingView,
        MessageComposerTrailingView,
        isKeyboardVisible,
        isOnline,
        members,
        messageInputFloating,
        messageInputHeightStore,
        MessageInputHeaderView,
        MessageInputTrailingView,
        openPollCreationDialog,
        Reply,
        SendButton,
        sendMessage,
        SendMessageDisallowedIndicator,
        showPollCreationDialog,
        StartAudioRecordingButton,
        StopMessageStreamingButton,
        t,
        uploadNewFile,
        watchers,
      }}
      {...props}
    />
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
