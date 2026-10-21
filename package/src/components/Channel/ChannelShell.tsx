import React, { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import type {
  Channel,
  ChannelConfig,
  ChannelDataState,
  ChannelLifecycleState,
  MessageComposerConfig,
  Event as StreamEvent,
  Thread,
} from 'stream-chat';

import { useCreateChannelContext } from './hooks/useCreateChannelContext';
import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';
import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';
import { useCreateOwnCapabilitiesContext } from './hooks/useCreateOwnCapabilitiesContext';

import {
  AttachmentPickerContextValue,
  AttachmentPickerProvider,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  AudioPlayerContextProps,
  AudioPlayerProvider,
} from '../../contexts/audioPlayerContext/AudioPlayerContext';
import { ChannelContextValue, ChannelProvider } from '../../contexts/channelContext/ChannelContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { MessageComposerProvider } from '../../contexts/messageComposerContext/MessageComposerContext';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  MessagesProvider,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OwnCapabilitiesContextValue,
  OwnCapabilitiesProvider,
} from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { useStableCallback } from '../../hooks';
import { useAppStateListener } from '../../hooks/useAppStateListener';
import { useAttachmentPickerBottomSheet } from '../../hooks/useAttachmentPickerBottomSheet';
import { useStateStore } from '../../hooks/useStateStore';
import {
  isDocumentPickerAvailable,
  isImageMediaLibraryAvailable,
  isImagePickerAvailable,
  NativeHandlers,
} from '../../native';
import { MessageInputHeightStore } from '../../state-store/message-input-height-store';
import { ReactionData } from '../../utils/utils';
import { NotificationAnnouncer } from '../Accessibility/NotificationAnnouncer';
import { AttachmentPicker } from '../AttachmentPicker/AttachmentPicker';
import type { KeyboardCompatibleViewProps } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import { Emoji } from '../MessageMenu/EmojiPickerList';
import { emojis } from '../MessageMenu/emojis';
import { toUnicodeScalarString } from '../MessageMenu/utils/toUnicodeScalarString';

export const reactionData: ReactionData[] = [
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'👍'} size={size} />,
    type: 'like',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😂'} size={size} />,
    type: 'haha',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'❤️'} size={size} />,
    type: 'love',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😮'} size={size} />,
    type: 'wow',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😢'} size={size} />,
    type: 'sad',
    isMain: true,
  },
  ...emojis.map((emoji) => ({
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={emoji} size={size} />,
    type: toUnicodeScalarString(emoji),
  })),
];

/**
 * Configuration shared by `<Channel>` and `<Thread>` for the message list, messages and composer
 * below them.
 */
export type ChannelConfigProps = Partial<
  Pick<
    AttachmentPickerContextValue,
    | 'bottomInset'
    | 'topInset'
    | 'disableAttachmentPicker'
    | 'shouldRenderAttachmentPicker'
    | 'numberOfAttachmentPickerImageColumns'
    | 'numberOfAttachmentImagesToLoadPerCall'
  >
> &
  Partial<
    Pick<
      ChannelContextValue,
      | 'enableMessageGroupingByUser'
      | 'enforceUniqueReaction'
      | 'hideStickyDateHeader'
      | 'allowDateSeparatorForSystemMessages'
      | 'hideDateSeparators'
      | 'maxTimeBetweenGroupedMessages'
    >
  > &
  Partial<
    Pick<
      InputMessageInputContextValue,
      | 'additionalTextInputProps'
      | 'asyncMessagesLockDistance'
      | 'asyncMessagesMinimumPressDuration'
      | 'audioRecordingSendOnComplete'
      | 'asyncMessagesSlideToCancelDistance'
      | 'attachmentPickerBottomSheetHeight'
      | 'attachmentSelectionBarHeight'
      | 'audioRecordingEnabled'
      | 'compressImageQuality'
      | 'createPollOptionGap'
      | 'focusInputOnPickerClose'
      | 'handleAttachButtonPress'
      | 'hasCameraPicker'
      | 'hasCommands'
      | 'hasFilePicker'
      | 'hasImagePicker'
      | 'messageInputFloating'
      | 'openPollCreationDialog'
      | 'setInputRef'
    >
  > &
  Partial<
    Pick<
      MessagesContextValue,
      | 'additionalPressableProps'
      | 'customMessageSwipeAction'
      | 'disableTypingIndicator'
      | 'dismissKeyboardOnMessageTouch'
      | 'enableSwipeToReply'
      | 'urlPreviewType'
      | 'FlatList'
      | 'forceAlignMessages'
      | 'getMessageGroupStyle'
      | 'giphyVersion'
      | 'handleBan'
      | 'handleCopy'
      | 'handleDelete'
      | 'handleDeleteForMe'
      | 'handleEdit'
      | 'handleFlag'
      | 'handleMarkUnread'
      | 'handleMute'
      | 'handlePinMessage'
      | 'handleReaction'
      | 'handleQuotedReply'
      | 'handleRetry'
      | 'handleThreadReply'
      | 'handleBlockUser'
      | 'isAttachmentEqual'
      | 'markdownRules'
      | 'messageActions'
      | 'messageContentOrder'
      | 'messageOverlayTargetId'
      | 'messageTextNumberOfLines'
      | 'messageSwipeToReplyHitSlop'
      | 'myMessageTheme'
      | 'onAlsoSentToChannelHeaderPress'
      | 'onLongPressMessage'
      | 'onPressInMessage'
      | 'onPressMessage'
      | 'reactionListPosition'
      | 'reactionListType'
      | 'shouldShowUnreadUnderlay'
      | 'selectReaction'
      | 'supportedReactions'
      | 'hasCreatePoll'
    >
  > & {
    /** Additional props passed to the keyboard avoiding view. */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardCompatibleViewProps>;
    /**
     * If true, multiple audio players can play simultaneously.
     * @default true
     */
    allowConcurrentAudioPlayback?: boolean;
    /**
     * Disables the `KeyboardCompatibleView` that resizes the channel when the keyboard opens or
     * closes, for apps that use React Native's `KeyboardAvoidingView` or handle it themselves.
     * Defaults to false.
     */
    disableKeyboardCompatibleView?: boolean;
    keyboardBehavior?: KeyboardCompatibleViewProps['behavior'];
    keyboardVerticalOffset?: number;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
  };

type ChannelShellProps = ChannelConfigProps & {
  channel: Channel;
  hasPendingInitialTargetLoad: () => boolean;
  /** Set by `<Thread>`: the list and composer below show this thread's replies. */
  thread?: Thread;
};

// Resolved poll composition: the channel type's `polls` flag combined with anything registered
// through `client.config.set({ messageComposer: { polls } })`.
const composerPollsSelector = (state: MessageComposerConfig) => ({
  pollsEnabled: state.polls.enabled,
});

// The slash commands the channel type offers, as the server reports them.
const availableCommandsSelector = (state: ChannelConfig) => ({
  availableCommands: state.availableCommands,
});

const channelStatusSelector = (state: ChannelDataState & ChannelLifecycleState) => ({
  frozen: state.data?.frozen ?? false,
  pendingDisposal: state.pendingDisposal,
});

/**
 * The providers a message list and composer need, shared by `<Channel>` and `<Thread>`, which each
 * own their lifecycle (watching, loading, marking read) and render this around their children.
 */
export const ChannelShell = (props: PropsWithChildren<ChannelShellProps>) => {
  const {
    disableAttachmentPicker = !isImageMediaLibraryAvailable(),
    shouldRenderAttachmentPicker = true,
    additionalKeyboardAvoidingViewProps,
    additionalPressableProps,
    additionalTextInputProps,
    allowConcurrentAudioPlayback = false,
    asyncMessagesLockDistance = 50,
    asyncMessagesMinimumPressDuration = 500,
    asyncMessagesSlideToCancelDistance = 75,
    audioRecordingSendOnComplete = false,
    attachmentPickerBottomSheetHeight = disableAttachmentPicker ? 72 : 333,
    attachmentSelectionBarHeight = 72,
    audioRecordingEnabled = false,
    numberOfAttachmentImagesToLoadPerCall = 25,
    numberOfAttachmentPickerImageColumns = 3,
    giphyVersion = 'fixed_height',
    bottomInset = 0,
    channel,
    children,
    compressImageQuality,
    createPollOptionGap,
    customMessageSwipeAction,
    disableKeyboardCompatibleView = false,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch = true,
    enableMessageGroupingByUser = true,
    enableSwipeToReply = true,
    enforceUniqueReaction = false,
    FlatList = NativeHandlers.FlatList,
    focusInputOnPickerClose = true,
    forceAlignMessages,
    getMessageGroupStyle,
    handleAttachButtonPress,
    handleBan,
    handleCopy,
    handleDelete,
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    hasCameraPicker = isImagePickerAvailable(),
    hasCommands,
    hasCreatePoll,
    // The file picker is hidden when no document picker is available.
    hasFilePicker = isDocumentPickerAvailable(),
    hasImagePicker = isImagePickerAvailable() || isImageMediaLibraryAvailable(),
    hasPendingInitialTargetLoad,
    allowDateSeparatorForSystemMessages = false,
    hideDateSeparators = false,
    hideStickyDateHeader = false,
    isAttachmentEqual,
    keyboardBehavior,
    keyboardVerticalOffset,
    markdownRules,
    maxTimeBetweenGroupedMessages,
    messageActions,
    messageContentOrder = [
      'quoted_reply',
      'gallery',
      'files',
      'poll',
      'ai_text',
      'attachments',
      'location',
      'text',
    ],
    messageOverlayTargetId,
    messageInputFloating = false,
    messageSwipeToReplyHitSlop,
    messageTextNumberOfLines,
    myMessageTheme,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    onAlsoSentToChannelHeaderPress,
    openPollCreationDialog,
    overrideOwnCapabilities,
    reactionListPosition = 'top',
    reactionListType = 'clustered',
    selectReaction,
    setInputRef,
    shouldShowUnreadUnderlay = true,
    supportedReactions = reactionData,
    thread,
    topInset = 0,
    urlPreviewType = 'full',
  } = props;

  const { KeyboardCompatibleView } = useComponentsContext();

  const [messageInputHeightStore] = useState(() => new MessageInputHeightStore());
  const { bottomSheetRef, closePicker, openPicker } = useAttachmentPickerBottomSheet();

  const { frozen, pendingDisposal } = useStateStore(channel.state, channelStatusSelector);

  const channelId = channel?.id || '';
  const { pollsEnabled } = useStateStore(
    channel?.messageComposer?.configState,
    composerPollsSelector,
  ) ?? { pollsEnabled: false };
  const pollCreationEnabled = !pendingDisposal && !!channel?.id && pollsEnabled;

  // Sent as an event because `channel.stopTyping()` does nothing once the socket is closed, which
  // `<Chat>` usually does on background before this runs.
  const handleAppBackground = useCallback(() => {
    if (!channel.isTyping || !channel.data?.own_capabilities?.includes('send-typing-events')) {
      return;
    }
    channel.sendEvent({
      event: {
        parent_id: thread?.id,
        type: 'typing.stop',
      },
    } as { event: StreamEvent });
  }, [channel, thread?.id]);

  useAppStateListener(undefined, handleAppBackground);

  // Read from the channel's resolved configuration. The `hasCommands` prop, when set, takes
  // priority over the server's command list.
  const { availableCommands } = useStateStore(channel?.configState, availableCommandsSelector) ?? {
    availableCommands: [],
  };

  const handleClosePicker = useStableCallback(() => closePicker(bottomSheetRef));
  const handleOpenPicker = useStableCallback(() => openPicker(bottomSheetRef));

  const attachmentPickerContext = useMemo(
    () => ({
      bottomInset,
      bottomSheetRef,
      closePicker: handleClosePicker,
      disableAttachmentPicker,
      openPicker: handleOpenPicker,
      shouldRenderAttachmentPicker,
      topInset,
      numberOfAttachmentPickerImageColumns,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      numberOfAttachmentImagesToLoadPerCall,
    }),
    [
      bottomInset,
      bottomSheetRef,
      handleClosePicker,
      disableAttachmentPicker,
      handleOpenPicker,
      shouldRenderAttachmentPicker,
      topInset,
      numberOfAttachmentPickerImageColumns,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      numberOfAttachmentImagesToLoadPerCall,
    ],
  );

  const ownCapabilitiesContext = useCreateOwnCapabilitiesContext({
    channel,
    overrideCapabilities: overrideOwnCapabilities,
  });

  const channelContext = useCreateChannelContext({
    channel,
    disabled: frozen,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    allowDateSeparatorForSystemMessages,
    hideDateSeparators,
    hideStickyDateHeader,
    maxTimeBetweenGroupedMessages,
    hasPendingInitialTargetLoad,
  });

  const inputMessageInputContext = useCreateInputMessageInputContext({
    additionalTextInputProps,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    audioRecordingSendOnComplete,
    asyncMessagesSlideToCancelDistance,
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    audioRecordingEnabled,
    channelId,
    compressImageQuality,
    createPollOptionGap,
    focusInputOnPickerClose,
    handleAttachButtonPress,
    hasCameraPicker,
    hasCommands: hasCommands ?? !!availableCommands.length,
    hasFilePicker,
    hasImagePicker,
    messageInputFloating,
    messageInputHeightStore,
    openPollCreationDialog,
    setInputRef,
  });

  const messagesContext = useCreateMessagesContext({
    additionalPressableProps,
    channelId,
    customMessageSwipeAction,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    FlatList,
    forceAlignMessages,
    getMessageGroupStyle,
    giphyVersion,
    handleBan,
    handleCopy,
    handleDelete,
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    hasCreatePoll:
      hasCreatePoll === undefined ? pollCreationEnabled : hasCreatePoll && pollCreationEnabled,
    isAttachmentEqual,
    markdownRules,
    messageActions,
    messageContentOrder,
    messageOverlayTargetId,
    messageSwipeToReplyHitSlop,
    messageTextNumberOfLines,
    myMessageTheme,
    onAlsoSentToChannelHeaderPress,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    reactionListPosition,
    reactionListType,
    selectReaction,
    shouldShowUnreadUnderlay,
    supportedReactions,
    urlPreviewType,
  });

  const audioPlayerContext = useMemo<AudioPlayerContextProps>(
    () => ({ allowConcurrentAudioPlayback }),
    [allowConcurrentAudioPlayback],
  );

  const messageComposerContext = useMemo(() => ({ channel, thread }), [channel, thread]);

  return (
    <KeyboardCompatibleView
      behavior={keyboardBehavior}
      enabled={!disableKeyboardCompatibleView}
      keyboardVerticalOffset={keyboardVerticalOffset}
      {...additionalKeyboardAvoidingViewProps}
    >
      <ChannelProvider value={channelContext}>
        <OwnCapabilitiesProvider value={ownCapabilitiesContext}>
          <MessagesProvider value={messagesContext}>
            <AttachmentPickerProvider value={attachmentPickerContext}>
              <MessageComposerProvider value={messageComposerContext}>
                <MessageInputProvider value={inputMessageInputContext}>
                  <AudioPlayerProvider value={audioPlayerContext}>
                    <NotificationAnnouncer />
                    <View style={{ height: '100%' }}>{children}</View>
                    {shouldRenderAttachmentPicker ? <AttachmentPicker /> : null}
                  </AudioPlayerProvider>
                </MessageInputProvider>
              </MessageComposerProvider>
            </AttachmentPickerProvider>
          </MessagesProvider>
        </OwnCapabilitiesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};
