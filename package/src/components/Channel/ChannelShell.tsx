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
import { useCreateThreadContext } from './hooks/useCreateThreadContext';

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
import { ThreadContextValue, ThreadProvider } from '../../contexts/threadContext/ThreadContext';
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
 * The configuration `<Channel>` and `<Thread>` share: everything that shapes how the message list,
 * the messages and the composer below them behave, as opposed to which conversation they show.
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
  > &
  Partial<Pick<ThreadContextValue, 'onAlsoSentToChannelHeaderPress'>> & {
    /**
     * Additional props passed to keyboard avoiding view
     */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardCompatibleViewProps>;
    /**
     * If true, multiple audio players will be allowed to play simultaneously
     * @default true
     */
    allowConcurrentAudioPlayback?: boolean;
    /**
     * When true, disables the KeyboardCompatibleView wrapper
     *
     * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
     * component to adjust the height of Channel when the keyboard is opened or dismissed. This prop provides the ability to disable this functionality in case you
     * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or handle dismissal yourself.
     * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
     */
    disableKeyboardCompatibleView?: boolean;
    keyboardBehavior?: KeyboardCompatibleViewProps['behavior'];
    keyboardVerticalOffset?: number;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
  };

type ChannelShellProps = ChannelConfigProps &
  Partial<Pick<ThreadContextValue, 'allowThreadMessagesInChannel'>> & {
    channel: Channel;
    hasPendingInitialTargetLoad: () => boolean;
    /**
     * Set by `<Thread>`: the list and the composer below show this thread's replies.
     */
    thread?: Thread;
  };

/**
 * Poll composition, resolved: the channel type's `polls` flag already ANDed with anything registered
 * through `client.config.set({ messageComposer: { polls } })`. Module scope keeps the reference stable.
 */
const composerPollsSelector = (state: MessageComposerConfig) => ({
  pollsEnabled: state.polls.enabled,
});

/**
 * The slash commands this channel type offers, as the server reports them. Lives on resolved channel
 * configuration so there is one place to read from — see `ChannelConfig.availableCommands`.
 */
const availableCommandsSelector = (state: ChannelConfig) => ({
  availableCommands: state.availableCommands,
});

const channelStatusSelector = (state: ChannelDataState & ChannelLifecycleState) => ({
  frozen: state.data?.frozen ?? false,
  pendingDisposal: state.pendingDisposal,
});

/**
 * The providers a message list and a composer need, shared by `<Channel>` and `<Thread>`. Each of
 * those owns its own lifecycle (watching, loading, marking read) and renders this around its children.
 */
export const ChannelShell = (props: PropsWithChildren<ChannelShellProps>) => {
  const {
    disableAttachmentPicker = !isImageMediaLibraryAvailable(),
    shouldRenderAttachmentPicker = true,
    additionalKeyboardAvoidingViewProps,
    additionalPressableProps,
    additionalTextInputProps,
    allowConcurrentAudioPlayback = false,
    allowThreadMessagesInChannel = true,
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
    // If pickDocument isn't available, default to hiding the file picker
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

  // Sent directly rather than through `channel.stopTyping()`, which does nothing once the socket is
  // closed, and `<Chat>` usually closes it on background before this runs.
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

  /**
   * Channel configs for use in disabling local functionality.
   * Nullish coalescing is used to give first priority to props to override
   * the server settings. Then priority to server settings to override defaults.
   *
   * Read from the channel's *resolved* configuration, which carries the server's command list as
   * `availableCommands`. That is reactive, so the list no longer has to be re-read imperatively on
   * every render — and it no longer throws for a channel pending disposal, which is why the previous
   * try/catch wrapper is gone.
   */
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
    threadList: !!thread,
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

  const threadContext = useCreateThreadContext({
    allowThreadMessagesInChannel,
    onAlsoSentToChannelHeaderPress,
    thread,
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
            <ThreadProvider value={threadContext}>
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
            </ThreadProvider>
          </MessagesProvider>
        </OwnCapabilitiesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};
