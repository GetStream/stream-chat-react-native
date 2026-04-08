import React, { PropsWithChildren, useContext, useMemo } from 'react';

import type { View } from 'react-native';

import type { UserResponse } from 'stream-chat';

import type {
  AttachmentPickerContentProps,
  InlineUnreadIndicatorProps,
  PollContentProps,
  StreamingMessageViewProps,
} from '../../components';
import type { AttachmentProps } from '../../components/Attachment/Attachment';
import type { AudioAttachmentProps } from '../../components/Attachment/Audio';
import type { FileAttachmentProps } from '../../components/Attachment/FileAttachment';
import type { FileAttachmentGroupProps } from '../../components/Attachment/FileAttachmentGroup';
import type { FileIconProps } from '../../components/Attachment/FileIcon';
import type { FilePreviewProps } from '../../components/Attachment/FilePreview';
import type { GalleryProps } from '../../components/Attachment/Gallery';
import type { GiphyProps } from '../../components/Attachment/Giphy';
import type { ImageLoadingFailedIndicatorProps } from '../../components/Attachment/ImageLoadingFailedIndicator';
import type { UnsupportedAttachmentProps } from '../../components/Attachment/UnsupportedAttachment';
import type {
  URLPreviewCompactProps,
  URLPreviewProps,
} from '../../components/Attachment/UrlPreview';
import type { VideoThumbnailProps } from '../../components/Attachment/VideoThumbnail';
import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type { InputViewProps } from '../../components/AutoCompleteInput/InputView';
import type { HeaderErrorProps } from '../../components/ChannelList/ChannelListHeaderErrorIndicator';
import type { ChannelDetailsBottomSheetProps } from '../../components/ChannelPreview/ChannelDetailsBottomSheet';
import type { ChannelLastMessagePreviewProps } from '../../components/ChannelPreview/ChannelLastMessagePreview';
import type { ChannelMessagePreviewDeliveryStatusProps } from '../../components/ChannelPreview/ChannelMessagePreviewDeliveryStatus';
import type { ChannelPreviewMessageProps } from '../../components/ChannelPreview/ChannelPreviewMessage';
import type { ChannelPreviewStatusProps } from '../../components/ChannelPreview/ChannelPreviewStatus';
import type { ChannelPreviewTitleProps } from '../../components/ChannelPreview/ChannelPreviewTitle';
import type { ChannelPreviewTypingIndicatorProps } from '../../components/ChannelPreview/ChannelPreviewTypingIndicator';
import type { ChannelPreviewUnreadCountProps } from '../../components/ChannelPreview/ChannelPreviewUnreadCount';
import type { ChannelPreviewViewProps } from '../../components/ChannelPreview/ChannelPreviewView';
import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingErrorProps } from '../../components/Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';
import type { KeyboardCompatibleViewProps } from '../../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import type { MessageProps } from '../../components/Message/Message';
import type { MessagePinnedHeaderProps } from '../../components/Message/MessageItemView/Headers/MessagePinnedHeader';
import type { MessageReminderHeaderProps } from '../../components/Message/MessageItemView/Headers/MessageReminderHeader';
import type { MessageSavedForLaterHeaderProps } from '../../components/Message/MessageItemView/Headers/MessageSavedForLaterHeader';
import type { SentToChannelHeaderProps } from '../../components/Message/MessageItemView/Headers/SentToChannelHeader';
import type { MessageAuthorProps } from '../../components/Message/MessageItemView/MessageAuthor';
import type { MessageBlockedProps } from '../../components/Message/MessageItemView/MessageBlocked';
import type { MessageBounceProps } from '../../components/Message/MessageItemView/MessageBounce';
import type { MessageContentProps } from '../../components/Message/MessageItemView/MessageContent';
import type { MessageDeletedProps } from '../../components/Message/MessageItemView/MessageDeleted';
import type { MessageFooterProps } from '../../components/Message/MessageItemView/MessageFooter';
import type { MessageHeaderProps } from '../../components/Message/MessageItemView/MessageHeader';
import type { MessageItemViewProps } from '../../components/Message/MessageItemView/MessageItemView';
import type { MessageRepliesProps } from '../../components/Message/MessageItemView/MessageReplies';
import type { MessageRepliesAvatarsProps } from '../../components/Message/MessageItemView/MessageRepliesAvatars';
import type { MessageStatusProps } from '../../components/Message/MessageItemView/MessageStatus';
import type { MessageTextProps } from '../../components/Message/MessageItemView/MessageTextContainer';
import type { MessageTimestampProps } from '../../components/Message/MessageItemView/MessageTimestamp';
import type { ReactionListBottomProps } from '../../components/Message/MessageItemView/ReactionList/ReactionListBottom';
import type { ReactionListClusteredProps } from '../../components/Message/MessageItemView/ReactionList/ReactionListClustered';
import type {
  ReactionListCountItemProps,
  ReactionListItemProps,
} from '../../components/Message/MessageItemView/ReactionList/ReactionListItem';
import type { ReactionListItemWrapperProps } from '../../components/Message/MessageItemView/ReactionList/ReactionListItemWrapper';
import type { ReactionListTopProps } from '../../components/Message/MessageItemView/ReactionList/ReactionListTop';
import type { AttachmentUploadPreviewListProps } from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadPreviewList';
import type {
  FileUploadNotSupportedIndicatorProps,
  FileUploadRetryIndicatorProps,
  ImageUploadRetryIndicatorProps,
} from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadProgressIndicator';
import type { AudioAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/AudioAttachmentUploadPreview';
import type { FileAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/FileAttachmentUploadPreview';
import type { ImageAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/ImageAttachmentUploadPreview';
import type { VideoAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/VideoAttachmentUploadPreview';
import type { AudioRecorderProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecorder';
import type { AudioRecordingButtonProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingButton';
import type { AudioRecordingInProgressProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingInProgress';
import type { AudioRecordingLockIndicatorProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator';
import type { AudioRecordingWaveformProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingWaveform';
import type { InputButtonsProps } from '../../components/MessageInput/components/InputButtons';
import type { AttachButtonProps } from '../../components/MessageInput/components/InputButtons/AttachButton';
import type { SendButtonProps } from '../../components/MessageInput/components/OutputButtons/SendButton';
import type { MessageComposerProps } from '../../components/MessageInput/MessageComposer';
import type { StopMessageStreamingButtonProps } from '../../components/MessageInput/StopMessageStreamingButton';
import type { DateHeaderProps } from '../../components/MessageList/DateHeader';
import type { InlineDateSeparatorProps } from '../../components/MessageList/InlineDateSeparator';
import type { MessageListProps } from '../../components/MessageList/MessageList';
import type { MessageSystemProps } from '../../components/MessageList/MessageSystem';
import type { ScrollToBottomButtonProps } from '../../components/MessageList/ScrollToBottomButton';
import type { StickyHeaderProps } from '../../components/MessageList/StickyHeader';
import type { TypingIndicatorContainerProps } from '../../components/MessageList/TypingIndicatorContainer';
import type { UnreadMessagesNotificationProps } from '../../components/MessageList/UnreadMessagesNotification';
import type { MessageActionListProps } from '../../components/MessageMenu/MessageActionList';
import type { MessageActionListItemProps } from '../../components/MessageMenu/MessageActionListItem';
import type { MessageMenuProps } from '../../components/MessageMenu/MessageMenu';
import type { MessageReactionPickerProps } from '../../components/MessageMenu/MessageReactionPicker';
import type { MessageUserReactionsProps } from '../../components/MessageMenu/MessageUserReactions';
import type { MessageUserReactionsAvatarProps } from '../../components/MessageMenu/MessageUserReactionsAvatar';
import type { MessageUserReactionsItemProps } from '../../components/MessageMenu/MessageUserReactionsItem';
import type { ReplyProps } from '../../components/Reply/Reply';
import type { ChannelAvatarProps } from '../../components/ui/Avatar/ChannelAvatar';
import type { MessageLocationProps } from '../messagesContext/MessagesContext';

/**
 * All overridable UI components in the SDK.
 * Every key is optional — only specify the components you want to override.
 */
export type ComponentOverrides = {
  // === MessagesContext components ===
  Attachment?: React.ComponentType<AttachmentProps>;
  AudioAttachment?: React.ComponentType<AudioAttachmentProps>;
  DateHeader?: React.ComponentType<DateHeaderProps>;
  UnsupportedAttachment?: React.ComponentType<UnsupportedAttachmentProps>;
  FilePreview?: React.ComponentType<FilePreviewProps>;
  FileAttachment?: React.ComponentType<FileAttachmentProps>;
  FileAttachmentGroup?: React.ComponentType<FileAttachmentGroupProps>;
  FileAttachmentIcon?: React.ComponentType<FileIconProps>;
  Gallery?: React.ComponentType<GalleryProps>;
  Giphy?: React.ComponentType<GiphyProps>;
  ImageLoadingFailedIndicator?: React.ComponentType<ImageLoadingFailedIndicatorProps>;
  ImageLoadingIndicator?: React.ComponentType;
  InlineDateSeparator?: React.ComponentType<InlineDateSeparatorProps>;
  InlineUnreadIndicator?: React.ComponentType<InlineUnreadIndicatorProps>;
  Message?: React.ComponentType<MessageProps>;
  MessageActionList?: React.ComponentType<MessageActionListProps>;
  MessageActionListItem?: React.ComponentType<MessageActionListItemProps>;
  MessageAuthor?: React.ComponentType<MessageAuthorProps>;
  MessageBlocked?: React.ComponentType<MessageBlockedProps>;
  MessageBounce?: React.ComponentType<MessageBounceProps>;
  MessageContent?: React.ComponentType<MessageContentProps>;
  MessageContentTopView?: React.ComponentType;
  MessageContentLeadingView?: React.ComponentType;
  MessageContentTrailingView?: React.ComponentType;
  MessageContentBottomView?: React.ComponentType;
  MessageDeleted?: React.ComponentType<MessageDeletedProps>;
  MessageError?: React.ComponentType;
  MessageFooter?: React.ComponentType<MessageFooterProps>;
  MessageHeader?: React.ComponentType<MessageHeaderProps>;
  MessageList?: React.ComponentType<MessageListProps>;
  MessageLocation?: React.ComponentType<MessageLocationProps>;
  MessageMenu?: React.ComponentType<MessageMenuProps>;
  MessagePinnedHeader?: React.ComponentType<MessagePinnedHeaderProps>;
  MessageReminderHeader?: React.ComponentType<MessageReminderHeaderProps>;
  MessageSavedForLaterHeader?: React.ComponentType<MessageSavedForLaterHeaderProps>;
  SentToChannelHeader?: React.ComponentType<SentToChannelHeaderProps>;
  MessageReactionPicker?: React.ComponentType<MessageReactionPickerProps>;
  MessageReplies?: React.ComponentType<MessageRepliesProps>;
  MessageRepliesAvatars?: React.ComponentType<MessageRepliesAvatarsProps>;
  MessageSpacer?: React.ComponentType;
  MessageItemView?: React.ComponentType<
    MessageItemViewProps & { ref?: React.RefObject<View | null> }
  >;
  MessageStatus?: React.ComponentType<MessageStatusProps>;
  MessageSwipeContent?: React.ComponentType;
  MessageSystem?: React.ComponentType<MessageSystemProps>;
  MessageText?: React.ComponentType<MessageTextProps>;
  MessageTimestamp?: React.ComponentType<MessageTimestampProps>;
  MessageUserReactions?: React.ComponentType<MessageUserReactionsProps>;
  MessageUserReactionsAvatar?: React.ComponentType<MessageUserReactionsAvatarProps>;
  MessageUserReactionsItem?: React.ComponentType<MessageUserReactionsItemProps>;
  Reply?: React.ComponentType<ReplyProps>;
  ScrollToBottomButton?: React.ComponentType<ScrollToBottomButtonProps>;
  StreamingMessageView?: React.ComponentType<StreamingMessageViewProps>;
  TypingIndicator?: React.ComponentType;
  TypingIndicatorContainer?: React.ComponentType<TypingIndicatorContainerProps>;
  UnreadMessagesNotification?: React.ComponentType<UnreadMessagesNotificationProps>;
  UrlPreview?: React.ComponentType<URLPreviewProps>;
  URLPreviewCompact?: React.ComponentType<URLPreviewCompactProps>;
  VideoThumbnail?: React.ComponentType<VideoThumbnailProps>;
  PollContent?: React.ComponentType<PollContentProps>;
  ReactionListBottom?: React.ComponentType<ReactionListBottomProps>;
  ReactionListTop?: React.ComponentType<ReactionListTopProps>;
  ReactionListClustered?: React.ComponentType<ReactionListClusteredProps>;
  ReactionListItem?: React.ComponentType<ReactionListItemProps>;
  ReactionListItemWrapper?: React.ComponentType<ReactionListItemWrapperProps>;
  ReactionListCountItem?: React.ComponentType<ReactionListCountItemProps>;

  // === MessageInputContext components ===
  AttachButton?: React.ComponentType<AttachButtonProps>;
  AudioRecorder?: React.ComponentType<AudioRecorderProps>;
  AudioRecordingInProgress?: React.ComponentType<AudioRecordingInProgressProps>;
  AudioRecordingLockIndicator?: React.ComponentType<AudioRecordingLockIndicatorProps>;
  AudioRecordingPreview?: React.ComponentType;
  AudioRecordingWaveform?: React.ComponentType<AudioRecordingWaveformProps>;
  AutoCompleteSuggestionHeader?: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem?: React.ComponentType<AutoCompleteSuggestionItemProps>;
  AutoCompleteSuggestionList?: React.ComponentType<AutoCompleteSuggestionListProps>;
  AttachmentPickerSelectionBar?: React.ComponentType;
  AttachmentUploadPreviewList?: React.ComponentType<AttachmentUploadPreviewListProps>;
  AudioAttachmentUploadPreview?: React.ComponentType<AudioAttachmentUploadPreviewProps>;
  ImageAttachmentUploadPreview?: React.ComponentType<ImageAttachmentUploadPreviewProps>;
  FileAttachmentUploadPreview?: React.ComponentType<FileAttachmentUploadPreviewProps>;
  VideoAttachmentUploadPreview?: React.ComponentType<VideoAttachmentUploadPreviewProps>;
  FileUploadInProgressIndicator?: React.ComponentType;
  FileUploadRetryIndicator?: React.ComponentType<FileUploadRetryIndicatorProps>;
  FileUploadNotSupportedIndicator?: React.ComponentType<FileUploadNotSupportedIndicatorProps>;
  ImageUploadInProgressIndicator?: React.ComponentType;
  ImageUploadRetryIndicator?: React.ComponentType<ImageUploadRetryIndicatorProps>;
  ImageUploadNotSupportedIndicator?: React.ComponentType;
  CooldownTimer?: React.ComponentType;
  SendButton?: React.ComponentType<SendButtonProps>;
  ShowThreadMessageInChannelButton?: React.ComponentType<{ threadList?: boolean }>;
  MessageComposerLeadingView?: React.ComponentType;
  MessageComposerTrailingView?: React.ComponentType;
  MessageInputHeaderView?: React.ComponentType;
  MessageInputFooterView?: React.ComponentType;
  MessageInputLeadingView?: React.ComponentType;
  MessageInputTrailingView?: React.ComponentType;
  StartAudioRecordingButton?: React.ComponentType<AudioRecordingButtonProps>;
  StopMessageStreamingButton?: React.ComponentType<StopMessageStreamingButtonProps> | null;
  Input?: React.ComponentType<
    Omit<MessageComposerProps, 'Input'> &
      InputButtonsProps & {
        getUsers: () => UserResponse[];
      }
  >;
  InputView?: React.ComponentType<InputViewProps>;
  InputButtons?: React.ComponentType<InputButtonsProps>;
  SendMessageDisallowedIndicator?: React.ComponentType;
  CreatePollContent?: React.ComponentType<PollContentProps>;

  // === ChannelContext components ===
  EmptyStateIndicator?: React.ComponentType<EmptyStateProps>;
  LoadingIndicator?: React.ComponentType<LoadingProps>;
  LoadingErrorIndicator?: React.ComponentType<LoadingErrorProps>;
  NetworkDownIndicator?: React.ComponentType;
  StickyHeader?: React.ComponentType<StickyHeaderProps>;
  KeyboardCompatibleView?: React.ComponentType<KeyboardCompatibleViewProps>;

  // === AttachmentPickerContext components ===
  ImageOverlaySelectedComponent?: React.ComponentType<{ index: number }>;
  AttachmentPickerIOSSelectMorePhotos?: React.ComponentType;
  AttachmentPickerContent?: React.ComponentType<AttachmentPickerContentProps>;

  // === ChannelsContext components ===
  FooterLoadingIndicator?: React.ComponentType;
  HeaderErrorIndicator?: React.ComponentType<HeaderErrorProps>;
  HeaderNetworkDownIndicator?: React.ComponentType;
  Preview?: React.ComponentType<ChannelPreviewViewProps>;
  PreviewAvatar?: React.ComponentType<ChannelAvatarProps>;
  PreviewMessage?: React.ComponentType<ChannelPreviewMessageProps>;
  PreviewMessageDeliveryStatus?: React.ComponentType<ChannelMessagePreviewDeliveryStatusProps>;
  PreviewMutedStatus?: React.ComponentType;
  PreviewStatus?: React.ComponentType<ChannelPreviewStatusProps>;
  PreviewTitle?: React.ComponentType<ChannelPreviewTitleProps>;
  PreviewUnreadCount?: React.ComponentType<ChannelPreviewUnreadCountProps>;
  PreviewTypingIndicator?: React.ComponentType<ChannelPreviewTypingIndicatorProps>;
  PreviewLastMessage?: React.ComponentType<ChannelLastMessagePreviewProps>;
  ChannelDetailsBottomSheet?: React.ComponentType<ChannelDetailsBottomSheetProps>;
  Skeleton?: React.ComponentType;
  ListHeaderComponent?: React.ComponentType;
};

const ComponentsContext = React.createContext<ComponentOverrides>({});

/**
 * Provider to override UI components at any level of the tree.
 * Supports nesting — inner overrides merge over outer ones (closest wins).
 *
 * @example
 * ```tsx
 * <WithComponents value={{ Message: MyCustomMessage, SendButton: MyCustomSendButton }}>
 *   <Channel channel={channel}>
 *     <MessageList />
 *     <MessageInput />
 *   </Channel>
 * </WithComponents>
 * ```
 */
export const WithComponents = ({
  children,
  value,
}: PropsWithChildren<{ value: ComponentOverrides }>) => {
  const parent = useContext(ComponentsContext);
  const merged = useMemo(
    () => ({ ...parent, ...value }),

    [parent, value],
  );
  return <ComponentsContext.Provider value={merged}>{children}</ComponentsContext.Provider>;
};

// Lazy-loaded to break circular dependency:
// defaultComponents.ts → imports components → components import useComponentsContext from this file
let cachedDefaults: ComponentOverrides | undefined;
const getDefaults = (): ComponentOverrides => {
  if (!cachedDefaults) {
    cachedDefaults = (require('./defaultComponents') as { DEFAULT_COMPONENTS: ComponentOverrides })
      .DEFAULT_COMPONENTS;
  }
  return cachedDefaults;
};

/**
 * Hook to access resolved component overrides.
 * Returns all components with defaults filled in — user overrides merged over defaults.
 */
export const useComponentsContext = () => {
  const overrides = useContext(ComponentsContext);
  return useMemo(
    () => ({ ...getDefaults(), ...overrides }) as Required<ComponentOverrides>,
    [overrides],
  );
};
