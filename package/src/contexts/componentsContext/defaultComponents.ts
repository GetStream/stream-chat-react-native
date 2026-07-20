import React from 'react';
import { TextInputProps } from 'react-native';

import type { LocalMessage, UserResponse } from 'stream-chat';

import { Attachment } from '../../components/Attachment/Attachment';
import { AttachmentUploadIndicator } from '../../components/Attachment/AttachmentUploadIndicator';
import { AudioAttachment } from '../../components/Attachment/Audio';
import { CircularProgressIndicator } from '../../components/Attachment/CircularProgressIndicator';
import { FileAttachment } from '../../components/Attachment/FileAttachment';
import { FileAttachmentGroup } from '../../components/Attachment/FileAttachmentGroup';
import { FileIcon } from '../../components/Attachment/FileIcon';
import { FilePreview } from '../../components/Attachment/FilePreview';
import { Gallery } from '../../components/Attachment/Gallery';
import { Giphy } from '../../components/Attachment/Giphy';
import { ImageLoadingFailedIndicator } from '../../components/Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator } from '../../components/Attachment/ImageLoadingIndicator';
import { MediaUploadProgressOverlay } from '../../components/Attachment/MediaUploadProgressOverlay';
import { UnsupportedAttachment } from '../../components/Attachment/UnsupportedAttachment';
import { URLPreview } from '../../components/Attachment/UrlPreview';
import { URLPreviewCompact } from '../../components/Attachment/UrlPreview/URLPreviewCompact';
import { VideoThumbnail } from '../../components/Attachment/VideoThumbnail';
import { AttachmentPickerContent } from '../../components/AttachmentPicker/components/AttachmentPickerContent';
import { AttachmentPickerSelectionBar } from '../../components/AttachmentPicker/components/AttachmentPickerSelectionBar';
import { ImageOverlaySelectedComponent } from '../../components/AttachmentPicker/components/ImageOverlaySelectedComponent';
import { AutoCompleteSuggestionHeader } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import {
  AutoCompleteSuggestionItem,
  MentionSuggestionItem,
} from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import { AutoCompleteSuggestionList } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import { InputView } from '../../components/AutoCompleteInput/InputView';
import { ChannelDetailsContent } from '../../components/ChannelDetails/ChannelDetails';
import {
  ChannelAddMembersButton,
  ChannelAddMembersForm,
  ChannelAddMembersFormContent,
  ChannelAddMembersFormHeader,
  ChannelDetailsActionsSection,
  ChannelDetailsActionItem,
  ChannelDetailsMemberSection,
  ChannelDetailsNavigationSection,
  ChannelDetailsProfile,
  ChannelDetailsEditButton,
  ChannelDetailsNavHeader,
  ChannelEditDetailsForm,
  ChannelEditDetailsFormContent,
  ChannelEditDetailsFormHeader,
  ChannelEditImageSheet,
  ChannelEditName,
  ChannelMemberActionsSheet,
  ChannelMemberItem,
  ChannelMemberList,
  FileAttachmentItem,
  FileAttachmentList,
  MediaItem,
  MediaList,
  PinnedMessageItem,
  PinnedMessageList,
  RoleItem,
  RoleList,
} from '../../components/ChannelDetails/components';
import { ChannelListFooterLoadingIndicator } from '../../components/ChannelList/ChannelListFooterLoadingIndicator';
import { ChannelListHeaderErrorIndicator } from '../../components/ChannelList/ChannelListHeaderErrorIndicator';
import { ChannelListHeaderNetworkDownIndicator } from '../../components/ChannelList/ChannelListHeaderNetworkDownIndicator';
import { ChannelListLoadingIndicator } from '../../components/ChannelList/ChannelListLoadingIndicator';
import { Skeleton } from '../../components/ChannelList/Skeleton';
import { ChannelDetailsBottomSheet } from '../../components/ChannelPreview/ChannelDetailsBottomSheet';
import { ChannelDetailsHeader } from '../../components/ChannelPreview/ChannelDetailsBottomSheet';
import { ChannelLastMessagePreview } from '../../components/ChannelPreview/ChannelLastMessagePreview';
import { ChannelMessagePreviewDeliveryStatus } from '../../components/ChannelPreview/ChannelMessagePreviewDeliveryStatus';
import { ChannelPreviewMessage } from '../../components/ChannelPreview/ChannelPreviewMessage';
import { ChannelPreviewMutedStatus } from '../../components/ChannelPreview/ChannelPreviewMutedStatus';
import { ChannelPreviewPinnedStatus } from '../../components/ChannelPreview/ChannelPreviewPinnedStatus';
import { ChannelPreviewStatus } from '../../components/ChannelPreview/ChannelPreviewStatus';
import { ChannelPreviewTitle } from '../../components/ChannelPreview/ChannelPreviewTitle';
import { ChannelPreviewTypingIndicator } from '../../components/ChannelPreview/ChannelPreviewTypingIndicator';
import { ChannelPreviewUnreadCount } from '../../components/ChannelPreview/ChannelPreviewUnreadCount';
import { ChannelPreviewView } from '../../components/ChannelPreview/ChannelPreviewView';
import { ImageGalleryFooter } from '../../components/ImageGallery/components/ImageGalleryFooter';
import { ImageGalleryHeader } from '../../components/ImageGallery/components/ImageGalleryHeader';
import { ImageGalleryVideoControl } from '../../components/ImageGallery/components/ImageGalleryVideoControl';
import { ImageGalleryGrid } from '../../components/ImageGallery/components/ImageGrid';
import { EmptyStateIndicator } from '../../components/Indicators/EmptyStateIndicator';
import { LoadingErrorIndicator } from '../../components/Indicators/LoadingErrorIndicator';
import { LoadingIndicator } from '../../components/Indicators/LoadingIndicator';
import { KeyboardCompatibleView } from '../../components/KeyboardCompatibleView/KeyboardCompatibleView';
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
import type { MessageTextProps } from '../../components/Message/MessageItemView/MessageTextContainer';
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
import { MessageReactionPicker } from '../../components/MessageMenu/MessageReactionPicker';
import { MessageUserReactions } from '../../components/MessageMenu/MessageUserReactions';
import { MessageUserReactionsAvatar } from '../../components/MessageMenu/MessageUserReactionsAvatar';
import { MessageUserReactionsItem } from '../../components/MessageMenu/MessageUserReactionsItem';
import { Notification, NotificationIcon, NotificationList } from '../../components/Notifications';
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
import { SvgAwareImage } from '../../components/UIComponents/SvgAwareImage';
import { DefaultMessageOverlayBackground } from '../../contexts/overlayContext/MessageOverlayHostLayer';
import type { MessageActionsProps } from '../../contexts/overlayContext/MessageOverlayHostLayer';
import { ArrowUp, Down } from '../../icons/arrow-up';
import { ArrowUpRight } from '../../icons/arrow-up-right';
import { Sound } from '../../icons/audio';
import { Bell } from '../../icons/bell';
import { Lightning } from '../../icons/bolt';
import { Camera } from '../../icons/camera';
import { Check, Tick } from '../../icons/checkmark';
import { Checkmark } from '../../icons/checkmark-1';
import { CheckAll } from '../../icons/checks';
import { ChevronLeft } from '../../icons/chevron-left';
import { ChevronRight } from '../../icons/chevron-right';
import { ChevronUp } from '../../icons/chevron-up';
import { Time } from '../../icons/clock';
import { CommandsIcon } from '../../icons/command';
import { Copy } from '../../icons/copy';
import { Delete } from '../../icons/delete';
import { Edit } from '../../icons/edit';
import { Smile } from '../../icons/emoji';
import { MoreEmojis } from '../../icons/emoji-add-1';
import { ExclamationCircle } from '../../icons/exclamation-circle-fill';
import { Exclamation } from '../../icons/exclamation-mark-fill';
import { Warning } from '../../icons/exclamation-triangle-fill';
import { EyeOpen } from '../../icons/EyeOpen';
import { File, FilePickerIcon } from '../../icons/file';
import { Audio } from '../../icons/filetype-audio-xl';
import { Code } from '../../icons/filetype-code-xl';
import { ZIP } from '../../icons/filetype-compression-xl';
import { OtherFileIcon } from '../../icons/filetype-other-xl';
import { PDF } from '../../icons/filetype-pdf-xl';
import { Presentation } from '../../icons/filetype-presentation-xl';
import { SpreadSheet } from '../../icons/filetype-spreadsheet-xl';
import { DOC } from '../../icons/filetype-text-xl';
import { Video } from '../../icons/filetype-video-xl';
import { Flag, MessageFlag } from '../../icons/flag';
import { Folder } from '../../icons/folder';
import { ImageGrid } from '../../icons/gallery';
import { Giphy as GiphyFiletypeIcon, GiphyIcon } from '../../icons/giphy';
import { PhotoIcon, Picture } from '../../icons/image';
import { Imgur } from '../../icons/imgur';
import { InfoTooltip } from '../../icons/info';
import { ArrowBoxLeft } from '../../icons/leave';
import { Link } from '../../icons/link';
import { Loading } from '../../icons/loading';
import { MapPin } from '../../icons/location';
import { Lock } from '../../icons/lock';
import { Megaphone } from '../../icons/megaphone';
import { MessageBubbleEmpty } from '../../icons/message-bubble';
import { Minus } from '../../icons/minus';
import { CircleMinus } from '../../icons/minus-circle';
import { MenuPointHorizontal } from '../../icons/more';
import { Mute } from '../../icons/mute';
import { BlockUser, CircleBan } from '../../icons/no-sign';
import { UnreadIndicator } from '../../icons/notification';
import { Pause } from '../../icons/pause-fill';
import { Pin } from '../../icons/pin';
import { Play } from '../../icons/play-fill';
import { Plus } from '../../icons/plus';
import { PollIcon, PollThumbnail } from '../../icons/poll';
import { Reload } from '../../icons/refresh';
import { DotGrid } from '../../icons/reorder';
import { ArrowShareLeft, CurveLineLeftUp } from '../../icons/reply';
import { ReplyConnectorLeft } from '../../icons/ReplyConnectorLeft';
import { ReplyConnectorRight } from '../../icons/ReplyConnectorRight';
import { Resend } from '../../icons/Retry';
import { Bookmark } from '../../icons/save';
import { Search } from '../../icons/search';
import { SendRight } from '../../icons/send';
import { Share } from '../../icons/share';
import { Shield } from '../../icons/shield';
import { Stop } from '../../icons/stop-fill';
import { ThreadReply } from '../../icons/thread';
import { Unknown } from '../../icons/Unknown';
import { Unlock } from '../../icons/unlock';
import { Unpin } from '../../icons/unpin';
import { UserAdd } from '../../icons/user-add';
import { UserDelete } from '../../icons/user-remove';
import { PeopleIcon } from '../../icons/users';
import type { IconProps } from '../../icons/utils/base';
import { VideoIcon } from '../../icons/video';
import { Recorder } from '../../icons/video-fill';
import { Mic } from '../../icons/voice';
import { XCircle } from '../../icons/x-circle';
import { NewClose } from '../../icons/xmark';
import { Cross } from '../../icons/xmark-1';

/**
 * Normalizes each component entry to React.ComponentType<P>, stripping
 * extra inferred properties (like `displayName: string` from runtime
 * assignments) that would otherwise leak into the override types and
 * force integrators to match them.
 */
type NormalizeComponents<T> = {
  [K in keyof T]: T[K] extends React.ComponentType<infer P> ? React.ComponentType<P> : T[K];
};

/**
 * All overridable icon components in the SDK, keyed by their exported name.
 * Exposed via `WithComponents` under the nested `icons` key so integrators can
 * swap any icon: `<WithComponents overrides={{ icons: { Mute: MyMute } }}>`.
 *
 * Only icons that are actually rendered by the SDK are registered here.
 */
export const defaultIcons = {
  ArrowBoxLeft,
  ArrowShareLeft,
  ArrowUp,
  ArrowUpRight,
  Audio,
  Bell,
  BlockUser,
  Bookmark,
  Camera,
  Check,
  CheckAll,
  Checkmark,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleBan,
  CircleMinus,
  Code,
  CommandsIcon,
  Copy,
  Cross,
  CurveLineLeftUp,
  Delete,
  DOC,
  DotGrid,
  Down,
  Edit,
  Exclamation,
  ExclamationCircle,
  EyeOpen,
  File,
  FilePickerIcon,
  Flag,
  Folder,
  Giphy: GiphyFiletypeIcon,
  GiphyIcon,
  ImageGrid,
  Imgur,
  InfoTooltip,
  Lightning,
  Link,
  Loading,
  Lock,
  MapPin,
  Megaphone,
  MenuPointHorizontal,
  MessageBubbleEmpty,
  MessageFlag,
  Mic,
  Minus,
  MoreEmojis,
  Mute,
  NewClose,
  OtherFileIcon,
  Pause,
  PDF,
  PeopleIcon,
  PhotoIcon,
  Picture,
  Pin,
  Play,
  Plus,
  PollIcon,
  PollThumbnail,
  Presentation,
  Recorder,
  Reload,
  ReplyConnectorLeft,
  ReplyConnectorRight,
  Resend,
  Search,
  SendRight,
  Share,
  Shield,
  Smile,
  Sound,
  SpreadSheet,
  Stop,
  ThreadReply,
  Tick,
  Time,
  Unknown,
  Unlock,
  Unpin,
  UnreadIndicator,
  UserAdd,
  UserDelete,
  Video,
  VideoIcon,
  Warning,
  XCircle,
  ZIP,
} satisfies Record<string, React.ComponentType<IconProps>>;

/**
 * Map of all overridable SDK icons. Used to type the `icons` override slot
 * and the resolved value returned by `useComponentsContext().icons`.
 */
export type IconsMap = typeof defaultIcons;

const components = {
  icons: defaultIcons,
  Attachment,
  AttachmentUploadIndicator,
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
  MentionSuggestionItem,
  ChannelDetailsBottomSheet,
  CooldownTimer,
  CircularProgressIndicator,
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
  ChannelListFooterLoadingIndicator,
  Gallery,
  Giphy,
  ChannelListHeaderErrorIndicator,
  ChannelListHeaderNetworkDownIndicator,
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
  ChannelListLoadingIndicator,
  MessageListLoadingIndicator: LoadingIndicator,
  MediaUploadProgressOverlay,
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
  Notification,
  NotificationIcon,
  NotificationList,
  ChannelPreview: ChannelPreviewView,
  ChannelPreviewAvatar: ChannelAvatar,
  ChannelPreviewLastMessage: ChannelLastMessagePreview,
  ChannelPreviewMessage,
  ChannelPreviewMessageDeliveryStatus: ChannelMessagePreviewDeliveryStatus,
  ChannelPreviewMutedStatus,
  ChannelPreviewPinnedStatus,
  ChannelPreviewStatus,
  ChannelPreviewTitle,
  ChannelPreviewTypingIndicator,
  ChannelPreviewUnreadCount,
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

  // Channel Details Screen
  ChannelAddMembersButton,
  ChannelAddMembersForm,
  ChannelAddMembersFormContent,
  ChannelAddMembersFormHeader,
  ChannelDetailsActionsSection,
  ChannelDetailsActionItem,
  ChannelDetailsMemberSection,
  ChannelDetailsNavigationSection,
  ChannelDetailsProfile,
  ChannelDetailsContent,
  ChannelDetailsEditButton,
  ChannelDetailsNavHeader,
  ChannelEditDetailsForm,
  ChannelEditDetailsFormContent,
  ChannelEditDetailsFormHeader,
  ChannelEditImageSheet,
  ChannelEditName,
  ChannelMemberActionsSheet,
  ChannelMemberItem,
  ChannelMemberList,
  RoleItem,
  RoleList,
  FileAttachmentItem,
  FileAttachmentList,
  MediaItem,
  MediaList,
  PinnedMessageItem,
  PinnedMessageList,

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
  ImageGalleryFooter,
  ImageGalleryGrid,
  ImageGalleryHeader,
  ImageGalleryVideoControls: ImageGalleryVideoControl,

  // Overlay
  MessageOverlayBackground: DefaultMessageOverlayBackground,

  // Image
  ImageComponent: SvgAwareImage,
};

/**
 * Optional component slots that have no default implementation.
 * These are `undefined` unless the integrator provides them via WithComponents.
 */
export interface OptionalComponentOverrides {
  AttachmentPickerIOSSelectMorePhotos?: React.ComponentType;
  ChatLoadingIndicator?: React.ComponentType | null;
  CreatePollContent?: React.ComponentType;
  Input?: React.ComponentType<{
    additionalTextInputProps?: TextInputProps;
    getUsers: () => UserResponse[];
  }>;
  ListHeaderComponent?: React.ComponentType;
  MessageActions?: React.ComponentType<MessageActionsProps>;
  MessageContentBottomView?: React.ComponentType;
  MessageContentLeadingView?: React.ComponentType;
  MessageContentTopView?: React.ComponentType;
  MessageContentTrailingView?: React.ComponentType;
  MessageLocation?: React.ComponentType<{ message: LocalMessage }>;
  MessageSpacer?: React.ComponentType;
  MessageText?: React.ComponentType<MessageTextProps>;
  PollContent?: React.ComponentType;
}

/**
 * All default component implementations used across the SDK.
 * These are the components used when no overrides are provided via WithComponents.
 *
 * The `NormalizeComponents` cast ensures that internal details like
 * `displayName: string` don't leak into the public override types.
 */
export const DEFAULT_COMPONENTS: NormalizeComponents<typeof components> = components;
