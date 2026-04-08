import React from 'react';

import { Attachment } from '../../components/Attachment/Attachment';
import { AudioAttachment } from '../../components/Attachment/Audio';
import { FileAttachment } from '../../components/Attachment/FileAttachment';
import { FileAttachmentGroup } from '../../components/Attachment/FileAttachmentGroup';
import { FileIcon } from '../../components/Attachment/FileIcon';
import { FilePreview } from '../../components/Attachment/FilePreview';
import { Gallery } from '../../components/Attachment/Gallery';
import { Giphy } from '../../components/Attachment/Giphy';
import { ImageLoadingFailedIndicator } from '../../components/Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../components/Attachment/ImageLoadingIndicator';
import { UnsupportedAttachment } from '../../components/Attachment/UnsupportedAttachment';
import { URLPreview } from '../../components/Attachment/UrlPreview';
import { URLPreviewCompact } from '../../components/Attachment/UrlPreview/URLPreviewCompact';
import { VideoThumbnail } from '../../components/Attachment/VideoThumbnail';
import { AttachmentPickerContent } from '../../components/AttachmentPicker/components/AttachmentPickerContent';
import { AttachmentPickerSelectionBar } from '../../components/AttachmentPicker/components/AttachmentPickerSelectionBar';
import { ImageOverlaySelectedComponent } from '../../components/AttachmentPicker/components/ImageOverlaySelectedComponent';
import { AutoCompleteSuggestionHeader } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import { AutoCompleteSuggestionItem } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import { AutoCompleteSuggestionList } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import { InputView } from '../../components/AutoCompleteInput/InputView';
import { ChannelListFooterLoadingIndicator } from '../../components/ChannelList/ChannelListFooterLoadingIndicator';
import { ChannelListHeaderErrorIndicator } from '../../components/ChannelList/ChannelListHeaderErrorIndicator';
import { ChannelListHeaderNetworkDownIndicator } from '../../components/ChannelList/ChannelListHeaderNetworkDownIndicator';
import { Skeleton } from '../../components/ChannelList/Skeleton';
import { ChannelDetailsBottomSheet } from '../../components/ChannelPreview/ChannelDetailsBottomSheet';
import { ChannelDetailsHeader } from '../../components/ChannelPreview/ChannelDetailsBottomSheet';
import { ChannelLastMessagePreview } from '../../components/ChannelPreview/ChannelLastMessagePreview';
import { ChannelMessagePreviewDeliveryStatus } from '../../components/ChannelPreview/ChannelMessagePreviewDeliveryStatus';
import { ChannelPreviewMessage } from '../../components/ChannelPreview/ChannelPreviewMessage';
import { ChannelPreviewMutedStatus } from '../../components/ChannelPreview/ChannelPreviewMutedStatus';
import { ChannelPreviewStatus } from '../../components/ChannelPreview/ChannelPreviewStatus';
import { ChannelPreviewTitle } from '../../components/ChannelPreview/ChannelPreviewTitle';
import { ChannelPreviewTypingIndicator } from '../../components/ChannelPreview/ChannelPreviewTypingIndicator';
import { ChannelPreviewUnreadCount } from '../../components/ChannelPreview/ChannelPreviewUnreadCount';
import { ChannelPreviewView } from '../../components/ChannelPreview/ChannelPreviewView';
import { ImageGalleryVideoControl } from '../../components/ImageGallery/components/ImageGalleryVideoControl';
import { EmptyStateIndicator } from '../../components/Indicators/EmptyStateIndicator';
import { LoadingErrorIndicator } from '../../components/Indicators/LoadingErrorIndicator';
import { LoadingIndicator } from '../../components/Indicators/LoadingIndicator';
import { KeyboardCompatibleView } from '../../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { Message } from '../../components/Message/Message';
import { MessagePinnedHeader } from '../../components/Message/MessageItemView/Headers/MessagePinnedHeader';
import { MessageReminderHeader } from '../../components/Message/MessageItemView/Headers/MessageReminderHeader';
import { MessageSavedForLaterHeader } from '../../components/Message/MessageItemView/Headers/MessageSavedForLaterHeader';
import { SentToChannelHeader } from '../../components/Message/MessageItemView/Headers/SentToChannelHeader';
import { MessageAuthor } from '../../components/Message/MessageItemView/MessageAuthor';
import { MessageBlocked } from '../../components/Message/MessageItemView/MessageBlocked';
import { MessageBounce } from '../../components/Message/MessageItemView/MessageBounce';
import { MessageContent } from '../../components/Message/MessageItemView/MessageContent';
import { MessageDeleted } from '../../components/Message/MessageItemView/MessageDeleted';
import { MessageError } from '../../components/Message/MessageItemView/MessageError';
import { MessageFooter } from '../../components/Message/MessageItemView/MessageFooter';
import { MessageHeader } from '../../components/Message/MessageItemView/MessageHeader';
import { MessageItemView } from '../../components/Message/MessageItemView/MessageItemView';
import { MessageReplies } from '../../components/Message/MessageItemView/MessageReplies';
import { MessageRepliesAvatars } from '../../components/Message/MessageItemView/MessageRepliesAvatars';
import { MessageStatus } from '../../components/Message/MessageItemView/MessageStatus';
import { MessageSwipeContent } from '../../components/Message/MessageItemView/MessageSwipeContent';
import { MessageTimestamp } from '../../components/Message/MessageItemView/MessageTimestamp';
import { ReactionListBottom } from '../../components/Message/MessageItemView/ReactionList/ReactionListBottom';
import { ReactionListClustered } from '../../components/Message/MessageItemView/ReactionList/ReactionListClustered';
import {
  ReactionListCountItem,
  ReactionListItem,
} from '../../components/Message/MessageItemView/ReactionList/ReactionListItem';
import { ReactionListItemWrapper } from '../../components/Message/MessageItemView/ReactionList/ReactionListItemWrapper';
import { ReactionListTop } from '../../components/Message/MessageItemView/ReactionList/ReactionListTop';
import { StreamingMessageView } from '../../components/Message/MessageItemView/StreamingMessageView';
import { AttachmentUploadPreviewList } from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadPreviewList';
import {
  FileUploadInProgressIndicator,
  FileUploadNotSupportedIndicator,
  FileUploadRetryIndicator,
  ImageUploadInProgressIndicator,
  ImageUploadNotSupportedIndicator,
  ImageUploadRetryIndicator,
} from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadProgressIndicator';
import { AudioAttachmentUploadPreview } from '../../components/MessageInput/components/AttachmentPreview/AudioAttachmentUploadPreview';
import { FileAttachmentUploadPreview } from '../../components/MessageInput/components/AttachmentPreview/FileAttachmentUploadPreview';
import { ImageAttachmentUploadPreview } from '../../components/MessageInput/components/AttachmentPreview/ImageAttachmentUploadPreview';
import { VideoAttachmentUploadPreview } from '../../components/MessageInput/components/AttachmentPreview/VideoAttachmentUploadPreview';
import { AudioRecorder } from '../../components/MessageInput/components/AudioRecorder/AudioRecorder';
import { AudioRecordingButton } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingButton';
import { AudioRecordingInProgress } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingInProgress';
import { AudioRecordingLockIndicator } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator';
import { AudioRecordingPreview } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingPreview';
import { AudioRecordingWaveform } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingWaveform';
import { InputButtons } from '../../components/MessageInput/components/InputButtons';
import { AttachButton } from '../../components/MessageInput/components/InputButtons/AttachButton';
import { CooldownTimer } from '../../components/MessageInput/components/OutputButtons/CooldownTimer';
import { SendButton } from '../../components/MessageInput/components/OutputButtons/SendButton';
import { MessageComposer } from '../../components/MessageInput/MessageComposer';
import { MessageComposerLeadingView } from '../../components/MessageInput/MessageComposerLeadingView';
import { MessageComposerTrailingView } from '../../components/MessageInput/MessageComposerTrailingView';
import { MessageInputFooterView } from '../../components/MessageInput/MessageInputFooterView';
import { MessageInputHeaderView } from '../../components/MessageInput/MessageInputHeaderView';
import { MessageInputLeadingView } from '../../components/MessageInput/MessageInputLeadingView';
import { MessageInputTrailingView } from '../../components/MessageInput/MessageInputTrailingView';
import { SendMessageDisallowedIndicator } from '../../components/MessageInput/SendMessageDisallowedIndicator';
import { ShowThreadMessageInChannelButton } from '../../components/MessageInput/ShowThreadMessageInChannelButton';
import { StopMessageStreamingButton } from '../../components/MessageInput/StopMessageStreamingButton';
import { DateHeader } from '../../components/MessageList/DateHeader';
import { InlineDateSeparator } from '../../components/MessageList/InlineDateSeparator';
import { InlineUnreadIndicator } from '../../components/MessageList/InlineUnreadIndicator';
import { MessageList } from '../../components/MessageList/MessageList';
import { MessageSystem } from '../../components/MessageList/MessageSystem';
import { NetworkDownIndicator } from '../../components/MessageList/NetworkDownIndicator';
import { ScrollToBottomButton } from '../../components/MessageList/ScrollToBottomButton';
import { StickyHeader } from '../../components/MessageList/StickyHeader';
import { TypingIndicator } from '../../components/MessageList/TypingIndicator';
import { TypingIndicatorContainer } from '../../components/MessageList/TypingIndicatorContainer';
import { UnreadMessagesNotification } from '../../components/MessageList/UnreadMessagesNotification';
import { MessageActionList } from '../../components/MessageMenu/MessageActionList';
import { MessageActionListItem } from '../../components/MessageMenu/MessageActionListItem';
import { MessageMenu } from '../../components/MessageMenu/MessageMenu';
import { MessageReactionPicker } from '../../components/MessageMenu/MessageReactionPicker';
import { MessageUserReactions } from '../../components/MessageMenu/MessageUserReactions';
import { MessageUserReactionsAvatar } from '../../components/MessageMenu/MessageUserReactionsAvatar';
import { MessageUserReactionsItem } from '../../components/MessageMenu/MessageUserReactionsItem';
import { PollAnswersListContent } from '../../components/Poll/components/PollAnswersList';
import { PollButtons } from '../../components/Poll/components/PollButtons';
import { PollAllOptionsContent } from '../../components/Poll/components/PollOption';
import { PollOptionFullResultsContent } from '../../components/Poll/components/PollResults/PollOptionFullResults';
import { PollResultsContent } from '../../components/Poll/components/PollResults/PollResults';
import { PollHeader } from '../../components/Poll/Poll';
import { Reply } from '../../components/Reply/Reply';
import {
  DefaultThreadListComponent as ThreadListComponent,
  DefaultThreadListEmptyPlaceholder,
  DefaultThreadListLoadingIndicator,
  DefaultThreadListLoadingNextIndicator,
} from '../../components/ThreadList/ThreadList';
import { ThreadListItemComponent as ThreadListItem } from '../../components/ThreadList/ThreadListItem';
import { ThreadListItemMessagePreview } from '../../components/ThreadList/ThreadListItemMessagePreview';
import { ThreadListUnreadBanner } from '../../components/ThreadList/ThreadListUnreadBanner';
import { ThreadMessagePreviewDeliveryStatus } from '../../components/ThreadList/ThreadMessagePreviewDeliveryStatus';
import { ChannelAvatar } from '../../components/ui/Avatar/ChannelAvatar';

/**
 * All default component implementations used across the SDK.
 * These are the components used when no overrides are provided via WithComponents.
 */
export const DEFAULT_COMPONENTS = {
  Attachment,
  AttachButton,
  AttachmentPickerContent,
  AttachmentPickerSelectionBar,
  AttachmentUploadPreviewList,
  AudioAttachment,
  AudioAttachmentUploadPreview,
  AudioRecorder,
  AudioRecordingInProgress,
  AudioRecordingLockIndicator,
  AudioRecordingPreview,
  AudioRecordingWaveform,
  AutoCompleteSuggestionHeader,
  AutoCompleteSuggestionItem,
  AutoCompleteSuggestionList,
  ChannelDetailsBottomSheet,
  CooldownTimer,
  DateHeader,
  EmptyStateIndicator,
  FileAttachment,
  FileAttachmentGroup,
  FileAttachmentIcon: FileIcon,
  FileAttachmentUploadPreview,
  FileUploadInProgressIndicator,
  FileUploadNotSupportedIndicator,
  FileUploadRetryIndicator,
  FilePreview,
  FooterLoadingIndicator: ChannelListFooterLoadingIndicator,
  Gallery,
  Giphy,
  HeaderErrorIndicator: ChannelListHeaderErrorIndicator,
  HeaderNetworkDownIndicator: ChannelListHeaderNetworkDownIndicator,
  ImageAttachmentUploadPreview,
  ImageLoadingFailedIndicator,
  ImageLoadingIndicator,
  ImageOverlaySelectedComponent,
  ImageUploadInProgressIndicator,
  ImageUploadNotSupportedIndicator,
  ImageUploadRetryIndicator,
  InlineDateSeparator,
  InlineUnreadIndicator,
  InputButtons,
  InputView,
  KeyboardCompatibleView,
  LoadingErrorIndicator,
  LoadingIndicator,
  Message,
  MessageActionList,
  MessageActionListItem,
  MessageAuthor,
  MessageBlocked,
  MessageBounce,
  MessageComposerLeadingView,
  MessageComposerTrailingView,
  MessageContent,
  MessageDeleted,
  MessageError,
  MessageFooter,
  MessageHeader,
  MessageInputFooterView,
  MessageInputHeaderView,
  MessageInputLeadingView,
  MessageInputTrailingView,
  MessageItemView,
  MessageList,
  MessageMenu,
  MessagePinnedHeader,
  MessageReactionPicker,
  MessageReminderHeader,
  MessageReplies,
  MessageRepliesAvatars,
  MessageSavedForLaterHeader,
  MessageStatus,
  MessageSwipeContent,
  MessageSystem,
  MessageTimestamp,
  MessageUserReactions,
  MessageUserReactionsAvatar,
  MessageUserReactionsItem,
  NetworkDownIndicator,
  Preview: ChannelPreviewView,
  PreviewAvatar: ChannelAvatar,
  PreviewLastMessage: ChannelLastMessagePreview,
  PreviewMessage: ChannelPreviewMessage,
  PreviewMessageDeliveryStatus: ChannelMessagePreviewDeliveryStatus,
  PreviewMutedStatus: ChannelPreviewMutedStatus,
  PreviewStatus: ChannelPreviewStatus,
  PreviewTitle: ChannelPreviewTitle,
  PreviewTypingIndicator: ChannelPreviewTypingIndicator,
  PreviewUnreadCount: ChannelPreviewUnreadCount,
  ReactionListBottom,
  ReactionListClustered,
  ReactionListCountItem,
  ReactionListItem,
  ReactionListItemWrapper,
  ReactionListTop,
  Reply,
  ScrollToBottomButton,
  SendButton,
  SendMessageDisallowedIndicator,
  SentToChannelHeader,
  ShowThreadMessageInChannelButton,
  Skeleton,
  StartAudioRecordingButton: AudioRecordingButton,
  StickyHeader,
  StopMessageStreamingButton,
  StreamingMessageView,
  TypingIndicator,
  TypingIndicatorContainer,
  UnreadMessagesNotification,
  UnsupportedAttachment,
  UrlPreview: URLPreview,
  URLPreviewCompact,
  VideoAttachmentUploadPreview,
  VideoThumbnail,

  // Channel details
  ChannelDetailsHeader,

  // Thread
  ThreadMessageComposer: MessageComposer,
  ThreadListComponent,
  ThreadListEmptyPlaceholder: DefaultThreadListEmptyPlaceholder,
  ThreadListItem,
  ThreadListItemMessagePreview,
  ThreadListLoadingIndicator: DefaultThreadListLoadingIndicator,
  ThreadListLoadingMoreIndicator: DefaultThreadListLoadingNextIndicator,
  ThreadListUnreadBanner,
  ThreadMessagePreviewDeliveryStatus,

  // Poll
  PollButtons,
  PollHeader,
  PollAllOptionsContent,
  PollAnswersListContent,
  PollResultsContent,
  PollOptionFullResultsContent,

  // ImageGallery
  ImageGalleryVideoControls: ImageGalleryVideoControl,

  // Optional overrides (no defaults — undefined unless user provides via WithComponents)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AttachmentPickerIOSSelectMorePhotos: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChatLoadingIndicator: undefined as React.ComponentType<any> | null | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CreatePollContent: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ImageComponent: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Input: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ListHeaderComponent: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageContentBottomView: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageContentLeadingView: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageContentTopView: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageContentTrailingView: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageLocation: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageSpacer: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MessageText: undefined as React.ComponentType<any> | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  PollContent: undefined as React.ComponentType<any> | undefined,
};
