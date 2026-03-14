import {
  Appearance,
  type ColorValue,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import type { CircleProps } from 'react-native-svg';

import type { IconProps } from '../../../icons/utils/base';
import { primitives, lightSemantics, darkSemantics } from '../../../theme';

export const DEFAULT_STATUS_ICON_SIZE = 16;
// TODO: Handle this better later depending on the size of the avatar used
export const BASE_AVATAR_SIZE = 24;

export const Colors = {
  accent_blue: '#005FFF',
  accent_dark_blue: '#005DFF',
  accent_error: '#D92F26',
  accent_green: '#20E070',
  accent_info: '#1FE06F',
  accent_red: '#FF3742',
  bg_gradient_end: '#F7F7F7',
  bg_gradient_start: '#FCFCFC',
  bg_user: '#F7F7F8',
  black: '#000000',
  blue_alice: '#E9F2FF',
  // border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
  code_block: '#DDDDDD',
  disabled: '#B4BBBA',
  grey: '#7A7A7A',
  grey_dark: '#72767E',
  grey_gainsboro: '#DBDBDB',
  grey_whisper: '#ECEBEB',
  icon_background: '#FFFFFF',
  label_bg_transparent: '#00000033', // 33 = 20% opacity
  light_blue: '#E0F0FF',
  light_gray: '#E9EAED',
  modal_shadow: '#00000099', // 99 = 60% opacity; x=0, y= 1, radius=4
  overlay: '#000000CC', // CC = 80% opacity
  selected: 'hsla(0, 0%, 0%, 0.15)',
  shadow_icon: '#00000040', // 40 = 25% opacity; x=0, y=0, radius=4
  static_black: '#000000',
  static_white: '#ffffff',
  targetedMessageBackground: '#FBF4DD', // dark mode = #302D22
  text_high_emphasis: '#080707',
  text_low_emphasis: '#7E828B',
  transparent: 'transparent',
  white: '#FFFFFF',
  white_smoke: '#F2F2F2',
  white_snow: '#FCFCFC',
};

export type MarkdownStyle = Partial<{
  autolink: TextStyle;
  blockQuoteBar: ViewStyle;
  blockQuoteSection: ViewStyle;
  blockQuoteSectionBar: ViewStyle;
  blockQuoteText: TextStyle | ViewStyle;
  br: TextStyle;
  codeBlock: TextStyle;
  del: TextStyle;
  em: TextStyle;
  heading: TextStyle;
  heading1: TextStyle;
  heading2: TextStyle;
  heading3: TextStyle;
  heading4: TextStyle;
  heading5: TextStyle;
  heading6: TextStyle;
  hr: ViewStyle;
  image: ImageStyle;
  inlineCode: TextStyle;
  list: ViewStyle;
  listItem: ViewStyle;
  listItemBullet: TextStyle;
  listItemNumber: TextStyle;
  listItemText: TextStyle;
  listRow: ViewStyle;
  mailTo: TextStyle;
  mentions: TextStyle;
  newline: TextStyle;
  noMargin: TextStyle;
  paragraph: TextStyle;
  paragraphCenter: TextStyle;
  paragraphWithImage: ViewStyle;
  strong: TextStyle;
  sublist: ViewStyle;
  table: ViewStyle;
  tableHeader: ViewStyle;
  tableHeaderCell: TextStyle;
  tableRow: ViewStyle;
  tableRowCell: TextStyle;
  tableRowLast: ViewStyle;
  text: TextStyle;
  u: TextStyle;
  view: ViewStyle;
}>;

export type Theme = {
  aiTypingIndicatorView: {
    container: ViewStyle;
    text: TextStyle;
  };
  attachmentPicker: {
    bottomSheetContentContainer: ViewStyle;
    durationText: TextStyle;
    content: {
      container: ViewStyle;
      infoContainer: ViewStyle;
      text: TextStyle;
    };
    image: ViewStyle;
    imageOverlay: ViewStyle;
    imageOverlaySelectedComponent: {
      check: ViewStyle;
    };
    handle: {
      container: ViewStyle;
      indicator: ViewStyle;
    };
  };
  attachmentSelectionBar: {
    container: ViewStyle;
    icon: ViewStyle;
  };
  audioAttachment: {
    container: ViewStyle;
    centerContainer: ViewStyle;
    audioInfo: ViewStyle;
    leftContainer: ViewStyle;
    playPauseButton: ViewStyle;
    progressControlContainer: ViewStyle;
    progressDurationText: TextStyle;
    rightContainer: ViewStyle;
    speedChangeButton: ViewStyle;
    speedChangeButtonText: TextStyle;
  };
  avatar: {
    BASE_AVATAR_SIZE: number;
    container: ViewStyle;
    image: ImageStyle;
    presenceIndicator: CircleProps;
    presenceIndicatorContainer: ViewStyle;
  };
  bottomSheetModal: {
    container: ViewStyle;
    contentContainer: ViewStyle;
    handle: ViewStyle;
    overlay: ViewStyle;
    wrapper: ViewStyle;
  };
  channel: {
    selectChannel: TextStyle;
  };
  channelListFooterLoadingIndicator: {
    container: ViewStyle;
  };
  channelListHeaderErrorIndicator: {
    container: ViewStyle;
    errorText: TextStyle;
  };
  channelListLoadingIndicator: {
    container: ViewStyle;
  };
  channelListMessenger: {
    flatList: ViewStyle;
    flatListContent: ViewStyle;
  };
  channelDetailsMenu: {
    contentContainer: ViewStyle;
    header: {
      container: ViewStyle;
      metaContainer: ViewStyle;
      metaText: TextStyle;
    };
    item: {
      container: ViewStyle;
      destructiveText: TextStyle;
      standardText: TextStyle;
    };
  };
  channelListSkeleton: {
    animationTime: number;
    avatar: ViewStyle;
    badge: ViewStyle;
    content: ViewStyle;
    container: ViewStyle;
    headerRow: ViewStyle;
    subtitle: ViewStyle;
    textContainer: ViewStyle;
    title: ViewStyle;
  };
  threadListSkeleton: {
    animationTime: number;
    avatar: ViewStyle;
    body: ViewStyle;
    content: ViewStyle;
    contentContainer: ViewStyle;
    container: ViewStyle;
    footerIcon: ViewStyle;
    footerPill: ViewStyle;
    footerRow: ViewStyle;
    headerLabel: ViewStyle;
    textContainer: ViewStyle;
    timestamp: ViewStyle;
  };
  colors: typeof Colors;
  channelPreview: {
    container: ViewStyle;
    contentContainer: ViewStyle;
    date: TextStyle;
    mutedStatus: IconProps;
    messageDeliveryStatus: {
      container: ViewStyle;
      text: TextStyle;
      checkAllIcon: IconProps;
      checkIcon: IconProps;
      timeIcon: IconProps;
    };
    lowerRow: ViewStyle;
    title: TextStyle;
    unreadContainer: ViewStyle;
    unreadText: TextStyle;
    typingIndicatorPreview: {
      container: ViewStyle;
      text: TextStyle;
    };
    upperRow: ViewStyle;
    statusContainer: ViewStyle;
    titleContainer: ViewStyle;
    wrapper: ViewStyle;
    message: {
      container: ViewStyle;
      subtitle: TextStyle;
      errorText: TextStyle;
      draftText: TextStyle;
    };
    messagePreview: {
      container: ViewStyle;
      subtitle: TextStyle;
    };
  };
  dateHeader: {
    container: ViewStyle;
    text: TextStyle;
  };
  emptyStateIndicator: {
    channelContainer: ViewStyle;
    channelDetails: TextStyle;
    channelTitle: TextStyle;
    messageContainer: ViewStyle;
    messageTitle: TextStyle;
  };
  groupAvatar: {
    container: ViewStyle;
    image: ImageStyle;
  };
  iconBadge: {
    icon: ViewStyle;
    iconInner: ViewStyle;
    unreadCount: TextStyle;
  };
  iconSquare: {
    container: ViewStyle;
    image: ImageStyle;
  };
  imageGallery: {
    footer: {
      centerContainer: ViewStyle;
      container: ViewStyle;
      imageCountText: TextStyle;
      innerContainer: ViewStyle;
      activityIndicatorContainer: ViewStyle;
      wrapper: ViewStyle;
    };
    grid: {
      container: ViewStyle;
      contentContainer: ViewStyle;
      gridAvatar: ImageStyle;
      gridAvatarWrapper: ViewStyle;
      gridImage: ViewStyle;
      handle: ViewStyle;
      handleText: TextStyle;
      overlay: ViewStyle;
    };
    header: {
      centerContainer: ViewStyle;
      container: ViewStyle;
      dateText: TextStyle;
      innerContainer: ViewStyle;
      usernameText: TextStyle;
    };
    videoControl: {
      container: ViewStyle;
      durationTextStyle: TextStyle;
      leftContainer: ViewStyle;
      progressContainer: ViewStyle;
    };
    backgroundColor?: string;
    pager?: ViewStyle;
    slide?: ImageStyle;
  };
  inlineDateSeparator: {
    container: ViewStyle;
    text: TextStyle;
  };
  loadingDots: {
    container: ViewStyle;
    loadingDot: ViewStyle;
    spacing: number;
  };
  loadingErrorIndicator: {
    container: ViewStyle;
    errorText: TextStyle;
    retryText: TextStyle;
  };
  loadingIndicator: {
    container: ViewStyle;
    loadingText: TextStyle;
  };

  messageInput: {
    attachButton: ViewStyle;
    attachButtonContainer: ViewStyle;
    attachmentSelectionBar: ViewStyle;
    attachmentUploadPreviewList: {
      flatList: ViewStyle;
      itemSeparator: ViewStyle;
    };
    audioRecordingButtonContainer: ViewStyle;
    audioRecorder: {
      arrowLeftIcon: IconProps;
      checkContainer: ViewStyle;
      circleStopIcon: IconProps;
      deleteContainer: ViewStyle;
      deleteIcon: IconProps;
      micContainer: ViewStyle;
      micIcon: IconProps;
      pausedContainer: ViewStyle;
      sendCheckIcon: IconProps;
      slideToCancelContainer: ViewStyle;
    };
    audioRecordingInProgress: {
      container: ViewStyle;
      durationText: TextStyle;
    };
    audioRecordingLockIndicator: {
      arrowUpIcon: IconProps;
      container: ViewStyle;
      lockIcon: IconProps;
    };
    audioRecordingPreview: {
      container: ViewStyle;
      currentTime: TextStyle;
      infoContainer: ViewStyle;
      pauseIcon: IconProps;
      playIcon: IconProps;
      progressBar: ViewStyle;
    };
    audioRecordingWaveform: {
      container: ViewStyle;
      waveform: ViewStyle;
    };
    container: ViewStyle;
    contentContainer: ViewStyle;
    cooldownButtonContainer: ViewStyle;
    cooldownTimer: {
      text: TextStyle;
    };
    dismissAttachmentUpload: {
      dismiss: ViewStyle;
      dismissIcon: IconProps;
      dismissIconColor: ColorValue;
    };
    editButton: ViewStyle;
    editButtonContainer: ViewStyle;
    fileAttachmentUploadPreview: {
      fileContainer: ViewStyle;
      filenameText: TextStyle;
      fileSizeText: TextStyle;
      fileTextContainer: ViewStyle;
      uploadProgressOverlay: ViewStyle;
      wrapper: ViewStyle;
    };
    fileUploadInProgressIndicator: {
      container: ViewStyle;
      indicator: ViewStyle;
    };
    fileUploadRetryIndicator: {
      container: ViewStyle;
      networkErrorContainer: ViewStyle;
      networkErrorText: TextStyle;
      retryButton: ViewStyle;
      retryText: TextStyle;
    };
    fileUploadNotSupportedIndicator: {
      container: ViewStyle;
      notSupportedText: TextStyle;
    };
    imageUploadInProgressIndicator: {
      container: ViewStyle;
      indicator: ViewStyle;
    };
    imageUploadRetryIndicator: {
      container: ViewStyle;
    };
    imageUploadNotSupportedIndicator: {
      container: ViewStyle;
    };
    fileUploadPreview: {
      flatList: ViewStyle;
    };
    floatingWrapper: ViewStyle;
    focusedInputBoxContainer: ViewStyle;
    imageAttachmentUploadPreview: {
      container: ViewStyle;
      upload: ImageStyle;
      wrapper: ViewStyle;
    };
    inputContainer: ViewStyle;
    inputBox: TextStyle;
    inputBoxContainer: ViewStyle;
    inputBoxWrapper: ViewStyle;
    inputButtonsContainer: ViewStyle;
    inputFloatingContainer: ViewStyle;
    micButtonContainer: ViewStyle;
    nativeAttachmentPicker: {
      buttonContainer: ViewStyle;
      buttonDimmerStyle: ViewStyle;
      container: ViewStyle;
    };
    outputButtonsContainer: ViewStyle;
    sendButton: ViewStyle;
    sendButtonContainer: ViewStyle;
    sendMessageDisallowedIndicator: {
      container: ViewStyle;
      text: TextStyle;
    };
    showThreadMessageInChannelButton: {
      check: IconProps;
      checkBoxActive: ViewStyle;
      checkBoxInactive: ViewStyle;
      container: ViewStyle;
      innerContainer: ViewStyle;
      text: TextStyle;
    };
    stopMessageStreamingButton: ViewStyle;
    stopMessageStreamingIcon: IconProps;
    suggestions: {
      command: {
        args: TextStyle;
        container: ViewStyle;
        iconContainer: ViewStyle;
        title: TextStyle;
      };
      emoji: {
        container: ViewStyle;
        text: TextStyle;
      };
      header: {
        container: ViewStyle;
        title: TextStyle;
      };
      item: ViewStyle;
      mention: {
        avatarSize: number;
        column: ViewStyle;
        container: ViewStyle;
        name: TextStyle;
        tag: TextStyle;
      };
    };
    suggestionsListContainer: {
      container: ViewStyle;
      flatlist: ViewStyle;
    };
    videoAttachmentUploadPreview: {
      durationContainer: ViewStyle;
      durationText: TextStyle;
    };
    wrapper: ViewStyle;
    linkPreviewList: {
      linkContainer: ViewStyle;
      linkIcon: ViewStyle;
      container: ViewStyle;
      imageWrapper: ViewStyle;
      dismissWrapper: ViewStyle;
      thumbnail: ImageStyle;
      wrapper: ViewStyle;
      metadataContainer: ViewStyle;
      text: TextStyle;
      titleText: TextStyle;
    };
  };
  messageList: {
    container: ViewStyle;
    contentContainer: ViewStyle;
    errorNotification: ViewStyle;
    errorNotificationText: TextStyle;
    inlineUnreadIndicator: {
      container: ViewStyle;
      text: TextStyle;
    };
    listContainer: ViewStyle;
    messageContainer: ViewStyle;
    inlineDateSeparatorContainer: ViewStyle;
    unreadUnderlayContainer: ViewStyle;
    messageSystem: {
      container: ViewStyle;
      dateText: TextStyle;
      line: ViewStyle;
      text: TextStyle;
      textContainer: ViewStyle;
    };
    scrollToBottomButtonContainer: ViewStyle;
    scrollToBottomButton: {
      container: ViewStyle;
      unreadCountNotificationContainer: ViewStyle;
      unreadCountNotificationText: TextStyle;
    };
    stickyHeaderContainer: ViewStyle;
    typingIndicatorContainer: ViewStyle;
    unreadMessagesNotificationContainer: ViewStyle;
    unreadMessagesNotification: {
      container: ViewStyle;
      leftButtonContainer: ViewStyle;
      rightButtonContainer: ViewStyle;
    };
  };
  messageMenu: {
    actionList: {
      container: ViewStyle;
      contentContainer: ViewStyle;
    };
    actionListItem: {
      container: ViewStyle;
      icon: ViewStyle;
      title: TextStyle;
    };
    bottomSheet: {
      height?: number;
    };
    reactionButton: {
      filledColor?: ColorValue;
      unfilledColor?: ColorValue;
      filledBackgroundColor?: ColorValue;
      unfilledBackgroundColor?: ColorValue;
    };
    reactionPicker: {
      buttonContainer: ViewStyle;
      container: ViewStyle;
      contentContainer: ViewStyle;
      reactionIconSize: number;
      emojiViewerButton: ViewStyle;
    };
    userReactions: {
      avatarContainer: ViewStyle;
      avatarInnerContainer: ViewStyle;
      avatarName: TextStyle;
      avatarNameContainer: ViewStyle;
      avatarSize: number;
      container: ViewStyle;
      contentContainer: ViewStyle;
      filledBackgroundColor?: ColorValue;
      flatlistContainer: ViewStyle;
      iconFilledColor?: ColorValue;
      iconUnFilledColor?: ColorValue;
      radius: number;
      reactionBubble: ViewStyle;
      reactionBubbleBackground: ViewStyle;
      reactionBubbleBorderRadius: number;
      reactionSelectorContainer: ViewStyle;
      reactionsText: TextStyle;
      title: TextStyle;
      unfilledBackgroundColor?: ColorValue;
    };
  };
  messagePreview: {
    message: TextStyle;
  };
  messageSimple: {
    actions: {
      button: ViewStyle & {
        defaultBackgroundColor?: ViewStyle['backgroundColor'];
        defaultBorderColor?: ViewStyle['borderColor'];
        primaryBackgroundColor?: ViewStyle['backgroundColor'];
        primaryBorderColor?: ViewStyle['borderColor'];
      };
      buttonText: TextStyle & {
        defaultColor?: TextStyle['color'];
        primaryColor?: TextStyle['color'];
      };
      container: ViewStyle;
    };
    avatarWrapper: {
      container: ViewStyle;
      spacer: ViewStyle;
    };
    card: {
      container: ViewStyle;
      cover: ImageStyle;
      footer: ViewStyle & {
        description: TextStyle;
        title: TextStyle;
      };
      linkPreview: ViewStyle;
      linkPreviewText: TextStyle;
    };
    container: ViewStyle;
    repliesContainer: ViewStyle;
    content: {
      container: ViewStyle;
      containerInner: ViewStyle;
      contentContainer: ViewStyle;
      editedTimestampContainer: ViewStyle;
      errorContainer: ViewStyle;
      errorIcon: IconProps;
      errorIconContainer: ViewStyle;
      eyeIcon: IconProps;
      lastMessageContainer: ViewStyle;
      /**
       * Available options for styling text:
       * https://github.com/andangrd/react-native-markdown-package/blob/main/styles.js
       */
      markdown: MarkdownStyle;
      messageGroupedSingleOrBottomContainer: ViewStyle;
      messageGroupedTopContainer: ViewStyle;
      metaText: TextStyle;
      replyBorder: ViewStyle;
      replyContainer: ViewStyle;
      textContainer: ViewStyle & {
        onlyEmojiMarkdown: MarkdownStyle;
      };
      wrapper: ViewStyle;
      timestampText?: TextStyle;
    };
    deleted: {
      containerInner: ViewStyle;
      deletedText: TextStyle;
      container: ViewStyle;
    };
    footer: {
      container: ViewStyle;
      name: TextStyle;
      editedText: TextStyle;
    };
    contentWrapper: ViewStyle;
    contentContainer: ViewStyle;
    leftAlignItems: ViewStyle;
    rightAlignItems: ViewStyle;
    messageGroupedSingleStyles: ViewStyle;
    messageGroupedBottomStyles: ViewStyle;
    messageGroupedTopStyles: ViewStyle;
    messageGroupedMiddleStyles: ViewStyle;
    file: {
      container: ViewStyle;
      details: ViewStyle;
      fileSize: TextStyle;
      icon: IconProps;
      title: TextStyle;
    };
    unsupportedAttachment: {
      container: ViewStyle;
      details: ViewStyle;
      title: TextStyle;
    };
    fileAttachmentGroup: {
      attachmentContainer: ViewStyle;
      container: ViewStyle;
    };
    gallery: {
      galleryContainer: ViewStyle;
      galleryItemColumn: ViewStyle;
      gridHeight: number;
      gridWidth: number;
      image: ImageStyle;
      imageContainer: ViewStyle;
      imageContainerStyle: ViewStyle;
      maxHeight: number;
      maxWidth: number;
      minHeight: number;
      minWidth: number;
      moreImagesContainer: ViewStyle;
      moreImagesText: TextStyle;
      thumbnail: ViewStyle;
      imageBorderRadius?: {
        borderBottomLeftRadius: number;
        borderBottomRightRadius: number;
        borderTopLeftRadius: number;
        borderTopRightRadius: number;
      };
    };
    giphy: {
      actionButtonContainer: ViewStyle;
      actionButton: ViewStyle;
      actionButtonText: TextStyle;
      container: ViewStyle;
      giphy: ImageStyle;
      giphyContainer: ViewStyle;
      giphyHeaderText: TextStyle;
      giphyMask: ViewStyle;
      giphyMaskText: TextStyle;
      header: ViewStyle;
      imageIndicatorContainer: ViewStyle;
    };
    compactUrlPreview: {
      wrapper: ViewStyle;
      container: ViewStyle;
      cardCover: ImageStyle;
      cardFooter: ViewStyle;
      title: TextStyle;
      description: TextStyle;
      linkPreview: ViewStyle;
      linkPreviewText: TextStyle;
    };
    lastMessageContainer: ViewStyle;
    loadingIndicator: {
      container: ViewStyle;
      roundedView: ViewStyle;
    };
    messageGroupedSingleOrBottomContainer: ViewStyle;
    messageGroupedTopContainer: ViewStyle;
    messageBlocked: {
      container: ViewStyle;
      line: ViewStyle;
      text: TextStyle;
      textContainer: ViewStyle;
    };
    bubble: {
      reactionListTopContainer: ViewStyle;
      contentContainer: ViewStyle;
      wrapper: ViewStyle;
      errorContainer: ViewStyle;
    };
    pinnedHeader: {
      container: ViewStyle;
      label: TextStyle;
    };
    savedForLaterHeader: {
      container: ViewStyle;
      label: TextStyle;
    };
    reminderHeader: {
      container: ViewStyle;
      label: TextStyle;
      dot: TextStyle;
      time: TextStyle;
    };
    sentToChannelHeader: {
      container: ViewStyle;
      label: TextStyle;
      dot: TextStyle;
      link: TextStyle;
    };
    reactionListBottom: {
      contentContainer: ViewStyle;
      columnWrapper: ViewStyle;
      rowSeparator: ViewStyle;
    };
    reactionListItem: {
      reactionCount: TextStyle;
      icon: {
        size: number;
        style: ViewStyle;
      };
    };
    reactionListClustered: {
      contentContainer: ViewStyle;
      reactionCount: TextStyle;
      iconStyle: ViewStyle;
      icon: {
        size: number;
        style: ViewStyle;
      };
    };
    reactionListItemWrapper: {
      wrapper: ViewStyle;
      container: ViewStyle;
    };
    reactionListTop: {
      container: ViewStyle;
      contentContainer: ViewStyle;
      list: ViewStyle;
      position: number;
    };
    replies: {
      container: ViewStyle;
      messageRepliesText: TextStyle;
      content: ViewStyle;
      avatarStackContainer: ViewStyle;
    };
    status: {
      checkAllIcon: IconProps;
      checkIcon: IconProps;
      container: ViewStyle;
      timeIcon: IconProps;
    };
    swipeContentContainer: ViewStyle;
    swipeLeftContent: {
      container: ViewStyle;
    };
    targetedMessageContainer: ViewStyle;
    videoThumbnail: {
      container: ViewStyle;
      roundedView: ViewStyle;
    };
    unreadUnderlayColor?: ColorValue;
    wrapper: ViewStyle;
  };
  poll: {
    allOptions: {
      listContainer: ViewStyle;
      titleContainer: ViewStyle;
      titleText: TextStyle;
      wrapper: ViewStyle;
    };
    answersList: {
      container: ViewStyle;
      contentContainer: ViewStyle;
      item: {
        answerText: TextStyle;
        container: ViewStyle;
        infoContainer: ViewStyle;
        userInfoContainer: ViewStyle;
      };
    };
    button: { container: ViewStyle; text: TextStyle };
    createContent: {
      addComment: {
        title: TextStyle;
        description: TextStyle;
        wrapper: ViewStyle;
        optionCardContent: ViewStyle;
        optionCardSwitch: ViewStyle;
      };
      anonymousPoll: {
        title: TextStyle;
        description: TextStyle;
        wrapper: ViewStyle;
        optionCardContent: ViewStyle;
        optionCardSwitch: ViewStyle;
      };
      headerContainer: ViewStyle;
      maxVotes: {
        input: TextStyle;
        validationText: TextStyle;
        wrapper: ViewStyle;
      };
      multipleAnswers: {
        description: TextStyle;
        input: TextStyle;
        row: ViewStyle;
        settingsWrapper: ViewStyle;
        title: TextStyle;
        optionCard: ViewStyle;
        optionCardContent: ViewStyle;
        optionCardSwitch: ViewStyle;
        wrapper: ViewStyle;
      };
      name: {
        input: TextStyle;
        title: TextStyle;
      };
      optionCardWrapper: ViewStyle;
      pollOptions: {
        addOption: {
          text: TextStyle;
          wrapper: ViewStyle;
        };
        container: ViewStyle;
        optionStyle: {
          content: ViewStyle;
          input: TextStyle;
          validationErrorText: TextStyle;
          wrapper: ViewStyle;
          validationErrorContainer: ViewStyle;
        };
        title: TextStyle;
      };
      scrollView: ViewStyle;
      sendButton: ViewStyle;
      suggestOption: {
        title: TextStyle;
        description: TextStyle;
        wrapper: ViewStyle;
        optionCardContent: ViewStyle;
        optionCardSwitch: ViewStyle;
      };
    };
    fullResults: {
      container: ViewStyle;
      contentContainer: ViewStyle;
      headerContainer: ViewStyle;
      headerText: TextStyle;
      headerTitle: TextStyle;
    };
    inputDialog: {
      button: TextStyle;
      buttonContainer: ViewStyle;
      container: ViewStyle;
      input: TextStyle;
      title: TextStyle;
      transparentContainer: ViewStyle;
    };
    message: {
      container: ViewStyle;
      header: {
        subtitle: TextStyle;
        title: TextStyle;
      };
      option: {
        container: ViewStyle;
        info: ViewStyle;
        header: ViewStyle;
        votesText: TextStyle;
        progressBarContainer: ViewStyle;
        progressBar: ViewStyle;
        text: TextStyle;
        voteButtonContainer: ViewStyle;
        votesContainer: ViewStyle;
        wrapper: ViewStyle;
      };
      optionsWrapper: ViewStyle;
    };
    modalHeader: {
      container: ViewStyle;
      title: TextStyle;
    };
    results: {
      container: ViewStyle;
      item: {
        container: ViewStyle;
        headerContainer: ViewStyle;
        title: TextStyle;
        titleMeta: TextStyle;
        voteCount: TextStyle;
      };
      scrollView: ViewStyle;
      title: TextStyle;
      titleMeta: TextStyle;
      vote: { container: ViewStyle; dateText: TextStyle; userName: TextStyle };
    };
  };
  progressControl: {
    container: ViewStyle;
    filledStyles: ViewStyle;
    thumb: ViewStyle;
  };
  reply: {
    audioIcon: IconProps;
    container: ViewStyle;
    dismissWrapper: ViewStyle;
    fileIcon: IconProps;
    leftContainer: ViewStyle;
    locationIcon: IconProps;
    linkIcon: IconProps;
    photoIcon: IconProps;
    pollIcon: IconProps;
    rightContainer: ViewStyle;
    title: TextStyle;
    subtitle: TextStyle;
    subtitleContainer: ViewStyle;
    videoIcon: IconProps;
    wrapper: ViewStyle;
    messagePreview: {
      container: ViewStyle;
      subtitle: TextStyle;
    };
  };
  screenPadding: number;
  spinner: ViewStyle;
  thread: {
    newThread: {
      container: ViewStyle;
      text: TextStyle;
      backgroundGradientStart?: string;
      backgroundGradientStop?: string;
      threadHeight?: number;
    };
  };
  threadListItem: {
    wrapper: ViewStyle;
    container: ViewStyle;
    content: ViewStyle;
    channelName: TextStyle;
    dateText: TextStyle;
    lowerRow: ViewStyle;
    messageRepliesText: TextStyle;
    previewMessageContainer: ViewStyle;
    unreadBubbleWrapper: ViewStyle;
    messagePreview: {
      container: ViewStyle;
      subtitle: TextStyle;
    };
    messagePreviewDeliveryStatus: {
      container: ViewStyle;
      text: TextStyle;
      username: TextStyle;
    };
  };
  threadListUnreadBanner: {
    text: TextStyle;
    container: ViewStyle;
  };
  typingIndicator: {
    container: ViewStyle;
    loadingDotsBubble: ViewStyle;
    avatarStackContainer: ViewStyle;
    text: TextStyle & {
      fontSize: TextStyle['fontSize'];
    };
  };
  waveProgressBar: {
    container: ViewStyle;
    thumb: ViewStyle;
    waveform: ViewStyle;
  };
  semantics: typeof lightSemantics; // themed semantics have the same type
};

export const defaultTheme: Theme = {
  semantics: Appearance.getColorScheme() === 'light' ? lightSemantics : darkSemantics,
  aiTypingIndicatorView: {
    container: {},
    text: {},
  },
  attachmentPicker: {
    bottomSheetContentContainer: {},
    durationText: {},
    content: {
      container: {},
      infoContainer: {},
      text: {},
    },
    handle: {
      container: {},
      indicator: {},
    },
    image: {},
    imageOverlay: {},
    imageOverlaySelectedComponent: {
      check: {},
    },
  },
  attachmentSelectionBar: {
    container: {},
    icon: {},
  },
  audioAttachment: {
    centerContainer: {},
    audioInfo: {},
    container: {},
    leftContainer: {},
    playPauseButton: {},
    progressControlContainer: {},
    progressDurationText: {},
    rightContainer: {},
    speedChangeButton: {},
    speedChangeButtonText: {},
  },
  avatar: {
    BASE_AVATAR_SIZE,
    container: {},
    image: {
      borderRadius: 16,
      height: 32,
      width: 32,
    },
    presenceIndicator: {
      cx: 6,
      cy: 6,
      r: 5,
      strokeWidth: 2,
    },
    presenceIndicatorContainer: {},
  },
  bottomSheetModal: {
    container: {},
    contentContainer: {},
    handle: {},
    overlay: {},
    wrapper: {},
  },
  channel: {
    selectChannel: {},
  },
  channelListFooterLoadingIndicator: {
    container: {},
  },
  channelListHeaderErrorIndicator: {
    container: {},
    errorText: {},
  },
  channelListLoadingIndicator: {
    container: {},
  },
  channelListMessenger: {
    flatList: {},
    flatListContent: {},
  },
  channelDetailsMenu: {
    contentContainer: {},
    header: {
      container: {},
      metaContainer: {},
      metaText: {},
    },
    item: {
      container: {},
      destructiveText: {},
      standardText: {},
    },
  },
  channelListSkeleton: {
    animationTime: 1000, // in milliseconds
    avatar: {},
    badge: {},
    content: {},
    container: {},
    headerRow: {},
    subtitle: {},
    textContainer: {},
    title: {},
  },
  threadListSkeleton: {
    animationTime: 1000, // in milliseconds
    avatar: {},
    body: {},
    content: {},
    contentContainer: {},
    container: {},
    footerIcon: {},
    footerPill: {},
    footerRow: {},
    headerLabel: {},
    textContainer: {},
    timestamp: {},
  },
  channelPreview: {
    container: {},
    contentContainer: {},
    date: {},
    message: {
      container: {},
      subtitle: {},
      errorText: {},
      draftText: {},
    },
    messageDeliveryStatus: {
      container: {},
      text: {},
      checkAllIcon: {},
      checkIcon: {},
      timeIcon: {},
    },
    mutedStatus: {},
    lowerRow: {},
    title: {},
    unreadContainer: {},
    unreadText: {},
    typingIndicatorPreview: {
      container: {},
      text: {},
    },
    upperRow: {},
    statusContainer: {},
    titleContainer: {},
    wrapper: {},
    messagePreview: {
      container: {},
      subtitle: {},
    },
  },
  colors: Colors,
  dateHeader: {
    container: {},
    text: {},
  },
  emptyStateIndicator: {
    channelContainer: {},
    channelDetails: {},
    channelTitle: {},
    messageContainer: {},
    messageTitle: {},
  },
  groupAvatar: {
    container: {},
    image: {
      resizeMode: 'cover',
    },
  },
  iconBadge: {
    icon: {},
    iconInner: {},
    unreadCount: {},
  },
  iconSquare: {
    container: {},
    image: {},
  },
  imageGallery: {
    footer: {
      centerContainer: {},
      container: {},
      imageCountText: {},
      innerContainer: {},
      activityIndicatorContainer: {},
      wrapper: {},
    },
    grid: {
      container: {},
      contentContainer: {},
      gridAvatar: {},
      gridAvatarWrapper: {},
      gridImage: {},
      handle: {},
      handleText: {},
      overlay: {},
    },
    header: {
      centerContainer: {},
      container: {},
      dateText: {},
      innerContainer: {},
      usernameText: {},
    },
    videoControl: {
      container: {},
      durationTextStyle: {},
      leftContainer: {},
      progressContainer: {},
    },
  },
  inlineDateSeparator: {
    container: {},
    text: {},
  },
  loadingDots: {
    container: {},
    loadingDot: {},
    spacing: primitives.spacingXxs,
  },
  loadingErrorIndicator: {
    container: {},
    errorText: {},
    retryText: {},
  },
  loadingIndicator: {
    container: {},
    loadingText: {},
  },
  messageInput: {
    attachButton: {},
    attachButtonContainer: {},
    attachmentSelectionBar: {},
    attachmentUploadPreviewList: {
      flatList: {},
      itemSeparator: {},
    },
    audioRecorder: {
      arrowLeftIcon: {},
      checkContainer: {},
      circleStopIcon: {},
      deleteContainer: {},
      deleteIcon: {},
      micContainer: {},
      micIcon: {},
      pausedContainer: {},
      sendCheckIcon: {},
      slideToCancelContainer: {},
    },
    audioRecordingButtonContainer: {},
    audioRecordingInProgress: { container: {}, durationText: {} },
    audioRecordingLockIndicator: { arrowUpIcon: {}, container: {}, lockIcon: {} },
    audioRecordingPreview: {
      container: {},
      currentTime: {},
      infoContainer: {},
      pauseIcon: {},
      playIcon: {},
      progressBar: {},
    },
    audioRecordingWaveform: { container: {}, waveform: {} },
    container: {},
    contentContainer: {},
    cooldownButtonContainer: {},
    cooldownTimer: {
      text: {},
    },
    dismissAttachmentUpload: {
      dismiss: {},
      dismissIcon: {},
      dismissIconColor: '',
    },
    editButton: {},
    editButtonContainer: {},
    fileAttachmentUploadPreview: {
      fileContainer: {},
      filenameText: {},
      fileSizeText: {},
      fileTextContainer: {},
      uploadProgressOverlay: {},
      wrapper: {},
    },
    fileUploadInProgressIndicator: {
      container: {},
      indicator: {},
    },
    fileUploadRetryIndicator: {
      container: {},
      networkErrorContainer: {},
      networkErrorText: {},
      retryButton: {},
      retryText: {},
    },
    fileUploadNotSupportedIndicator: {
      container: {},
      notSupportedText: {},
    },
    imageUploadInProgressIndicator: {
      container: {},
      indicator: {},
    },
    imageUploadRetryIndicator: {
      container: {},
    },
    imageUploadNotSupportedIndicator: {
      container: {},
    },
    fileUploadPreview: {
      flatList: {},
    },
    floatingWrapper: {},
    focusedInputBoxContainer: {},
    imageAttachmentUploadPreview: {
      container: {},
      upload: {},
      wrapper: {},
    },
    videoAttachmentUploadPreview: {
      durationContainer: {},
      durationText: {},
    },
    inputBox: {},
    inputBoxContainer: {},
    inputBoxWrapper: {},
    inputButtonsContainer: {},
    inputContainer: {},
    inputFloatingContainer: {},
    micButtonContainer: {},
    nativeAttachmentPicker: {
      buttonContainer: {},
      buttonDimmerStyle: {},
      container: {},
    },
    outputButtonsContainer: {},
    sendButton: {},
    sendButtonContainer: {},
    sendMessageDisallowedIndicator: {
      container: {},
      text: {},
    },
    showThreadMessageInChannelButton: {
      check: {},
      checkBoxActive: {},
      checkBoxInactive: {},
      container: {},
      innerContainer: {},
      text: {},
    },
    stopMessageStreamingButton: {},
    stopMessageStreamingIcon: {},
    suggestions: {
      command: {
        args: {},
        container: {},
        iconContainer: {},
        title: {},
      },
      emoji: {
        container: {},
        text: {},
      },
      header: {
        container: {},
        title: {},
      },
      item: {},
      mention: {
        avatarSize: 40,
        column: {},
        container: {},
        name: {},
        tag: {},
      },
    },
    suggestionsListContainer: {
      container: {},
      flatlist: {},
    },
    wrapper: {},
    linkPreviewList: {
      linkContainer: {},
      linkIcon: {},
      container: {},
      imageWrapper: {},
      dismissWrapper: {},
      thumbnail: {},
      wrapper: {},
      metadataContainer: {},
      text: {},
      titleText: {},
    },
  },
  messageList: {
    container: {},
    contentContainer: {},
    errorNotification: {},
    errorNotificationText: {},
    inlineUnreadIndicator: {
      container: {},
      text: {},
    },
    listContainer: {},
    messageContainer: {},
    inlineDateSeparatorContainer: {},
    unreadUnderlayContainer: {},
    messageSystem: {
      container: {},
      dateText: {},
      line: {},
      text: {},
      textContainer: {},
    },
    scrollToBottomButton: {
      container: {},
      unreadCountNotificationContainer: {},
      unreadCountNotificationText: {},
    },
    scrollToBottomButtonContainer: {},
    stickyHeaderContainer: {},
    typingIndicatorContainer: {},
    unreadMessagesNotification: {
      container: {},
      leftButtonContainer: {},
      rightButtonContainer: {},
    },
    unreadMessagesNotificationContainer: {},
  },
  messageMenu: {
    actionList: {
      container: {},
      contentContainer: {},
    },
    actionListItem: {
      container: {},
      icon: {},
      title: {},
    },
    bottomSheet: {},
    reactionButton: {},
    reactionPicker: {
      buttonContainer: {},
      container: {},
      contentContainer: {},
      reactionIconSize: 24,
      emojiViewerButton: {},
    },
    userReactions: {
      avatarContainer: {},
      avatarInnerContainer: {},
      avatarName: {},
      avatarNameContainer: {},
      avatarSize: 64,
      container: {},
      contentContainer: {},
      flatlistContainer: {},
      radius: 2,
      reactionBubble: {},
      reactionBubbleBackground: {},
      reactionBubbleBorderRadius: 24,
      reactionSelectorContainer: {},
      reactionsText: {},
      title: {},
    },
  },
  messagePreview: {
    message: {},
  },
  messageSimple: {
    actions: {
      button: {},
      buttonText: {},
      container: {},
    },
    avatarWrapper: {
      container: {},
      spacer: {
        height: BASE_AVATAR_SIZE,
        width: BASE_AVATAR_SIZE, // same as BASE_AVATAR_SIZE
      },
    },
    card: {
      container: {},
      cover: {},
      footer: {
        description: {},
        title: {},
      },
      linkPreview: {},
      linkPreviewText: {},
    },
    compactUrlPreview: {
      wrapper: {},
      container: {},
      cardCover: {},
      cardFooter: {},
      title: {},
      description: {},
      linkPreview: {},
      linkPreviewText: {},
    },
    container: {},
    repliesContainer: {},
    content: {
      container: {},
      containerInner: {},
      contentContainer: {},
      editedTimestampContainer: {},
      errorContainer: {
        paddingRight: 12,
        paddingTop: 0,
      },
      errorIcon: {
        height: 20,
        width: 20,
      },
      errorIconContainer: {
        bottom: -2,
        position: 'absolute',
        right: -12,
      },
      eyeIcon: {
        height: 16,
        width: 16,
      },
      lastMessageContainer: {},
      markdown: {},
      messageGroupedSingleOrBottomContainer: {},
      messageGroupedTopContainer: {},
      metaText: {
        fontSize: 12,
      },
      replyBorder: {},
      replyContainer: {},
      textContainer: {
        onlyEmojiMarkdown: { text: { fontSize: 50 } },
      },
      timestampText: {},
      wrapper: {},
    },
    deleted: {
      containerInner: {},
      deletedText: {},
      container: {},
    },
    footer: {
      container: {},
      name: {},
      editedText: {},
    },
    contentWrapper: {},
    contentContainer: {},
    leftAlignItems: {},
    rightAlignItems: {},
    messageGroupedSingleStyles: {},
    messageGroupedBottomStyles: {},
    messageGroupedTopStyles: {},
    messageGroupedMiddleStyles: {},
    file: {
      container: {},
      details: {},
      fileSize: {},
      icon: {},
      title: {},
    },
    unsupportedAttachment: {
      container: {},
      details: {},
      title: {},
    },
    fileAttachmentGroup: {
      attachmentContainer: {},
      container: {},
    },
    gallery: {
      galleryContainer: {},
      galleryItemColumn: {},
      gridHeight: 192,
      gridWidth: 256,
      image: {},
      imageBorderRadius: undefined,
      imageContainer: {},
      imageContainerStyle: {},
      maxHeight: 192,
      maxWidth: 256,
      minHeight: 120,
      minWidth: 120,
      moreImagesContainer: {},
      moreImagesText: {},
      thumbnail: {},
    },
    giphy: {
      actionButton: {},
      actionButtonContainer: {},
      actionButtonText: {},
      container: {},
      giphy: {},
      giphyContainer: {},
      giphyHeaderText: {},
      giphyMask: {},
      giphyMaskText: {},
      header: {},
      imageIndicatorContainer: {},
    },
    lastMessageContainer: {},
    loadingIndicator: {
      container: {},
      roundedView: {},
    },
    messageBlocked: {
      container: {},
      line: {},
      text: {},
      textContainer: {},
    },
    bubble: {
      reactionListTopContainer: {},
      contentContainer: {},
      wrapper: {},
      errorContainer: {},
    },
    messageGroupedSingleOrBottomContainer: {},
    messageGroupedTopContainer: {},
    pinnedHeader: {
      container: {},
      label: {},
    },
    savedForLaterHeader: {
      container: {},
      label: {},
    },
    reminderHeader: {
      container: {},
      label: {},
      dot: {},
      time: {},
    },
    sentToChannelHeader: {
      container: {},
      label: {},
      dot: {},
      link: {},
    },
    reactionListBottom: {
      contentContainer: {},
      columnWrapper: {},
      rowSeparator: {},
    },
    reactionListItem: {
      reactionCount: {},
      icon: {
        size: 12,
        style: {},
      },
    },
    reactionListItemWrapper: {
      wrapper: {},
      container: {},
    },
    reactionListTop: {
      container: {},
      contentContainer: {},
      list: {},
      position: 8,
    },
    reactionListClustered: {
      contentContainer: {},
      reactionCount: {},
      iconStyle: {},
      icon: {
        size: 12,
        style: {},
      },
    },
    replies: {
      container: {},
      content: {},
      messageRepliesText: {},
      avatarStackContainer: {},
    },
    status: {
      checkAllIcon: {},
      checkIcon: {},
      container: {},
      timeIcon: {},
    },
    swipeContentContainer: {},
    swipeLeftContent: {
      container: {},
    },
    targetedMessageContainer: {},
    videoThumbnail: {
      container: {},
      roundedView: {},
    },
    wrapper: {},
  },
  poll: {
    allOptions: {
      listContainer: {},
      titleContainer: {},
      titleText: {},
      wrapper: {},
    },
    answersList: {
      container: {},
      contentContainer: {},
      item: {
        answerText: {},
        container: {},
        infoContainer: {},
        userInfoContainer: {},
      },
    },
    button: { container: {}, text: {} },
    createContent: {
      addComment: {
        title: {},
        description: {},
        wrapper: {},
        optionCardContent: {},
        optionCardSwitch: {},
      },
      anonymousPoll: {
        title: {},
        description: {},
        wrapper: {},
        optionCardContent: {},
        optionCardSwitch: {},
      },
      headerContainer: {},
      maxVotes: {
        input: {},
        validationText: {},
        wrapper: {},
      },
      multipleAnswers: {
        row: {},
        description: {},
        input: {},
        optionCardContent: {},
        optionCardSwitch: {},
        settingsWrapper: {},
        title: {},
        optionCard: {},
        wrapper: {},
      },
      name: {
        input: {},
        title: {},
      },
      optionCardWrapper: {},
      pollOptions: {
        addOption: {
          text: {},
          wrapper: {},
        },
        container: {},
        optionStyle: {
          content: {},
          validationErrorContainer: {},
          input: {},
          validationErrorText: {},
          wrapper: {},
        },
        title: {},
      },
      scrollView: {},
      sendButton: {},
      suggestOption: {
        title: {},
        description: {},
        wrapper: {},
        optionCardContent: {},
        optionCardSwitch: {},
      },
    },
    fullResults: {
      container: {},
      contentContainer: {},
      headerContainer: {},
      headerText: {},
      headerTitle: {},
    },
    inputDialog: {
      button: {},
      buttonContainer: {},
      container: {},
      input: {},
      title: {},
      transparentContainer: {},
    },
    message: {
      container: {},
      header: {
        subtitle: {},
        title: {},
      },
      option: {
        container: {},
        info: {},
        header: {},
        text: {},
        progressBarContainer: {},
        progressBar: {},
        votesContainer: {},
        votesText: {},
        wrapper: {},
        voteButtonContainer: {},
      },
      optionsWrapper: {},
    },
    modalHeader: {
      container: {},
      title: {},
    },
    results: {
      container: {},
      item: {
        container: {},
        headerContainer: {},
        title: {},
        titleMeta: {},
        voteCount: {},
      },
      scrollView: {},
      title: {},
      titleMeta: {},
      vote: { container: {}, dateText: {}, userName: {} },
    },
  },
  progressControl: {
    container: {},
    filledStyles: {},
    thumb: {},
  },
  reply: {
    audioIcon: {},
    container: {},
    dismissWrapper: {},
    fileIcon: {},
    leftContainer: {},
    linkIcon: {},
    locationIcon: {},
    photoIcon: {},
    pollIcon: {},
    rightContainer: {},
    subtitle: {},
    subtitleContainer: {},
    title: {},
    videoIcon: {},
    wrapper: {},
    messagePreview: {
      container: {},
      subtitle: {},
    },
  },
  screenPadding: 16,
  spinner: {},
  thread: {
    newThread: {
      container: {},
      text: {},
    },
  },
  threadListItem: {
    previewMessageContainer: {},
    unreadBubbleWrapper: {},
    wrapper: {},
    container: {},
    content: {},
    channelName: {},
    dateText: {},
    lowerRow: {},
    messageRepliesText: {},
    messagePreview: {
      container: {},
      subtitle: {},
    },
    messagePreviewDeliveryStatus: {
      container: {},
      text: {},
      username: {},
    },
  },
  threadListUnreadBanner: {
    text: {},
    container: {},
  },
  typingIndicator: {
    container: {},
    loadingDotsBubble: {},
    avatarStackContainer: {},
    text: {
      fontSize: 14,
    },
  },
  waveProgressBar: {
    container: {},
    thumb: {},
    waveform: {},
  },
};
