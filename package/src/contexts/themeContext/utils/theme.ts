import type { ColorValue, ImageStyle, TextStyle, ViewStyle } from 'react-native';
import type { CircleProps, StopProps } from 'react-native-svg';

import type { IconProps } from '../../../icons/utils/base';

export const DEFAULT_STATUS_ICON_SIZE = 16;
export const BASE_AVATAR_SIZE = 32;

export const Colors = {
  accent_blue: '#005FFF',
  accent_dark_blue: '#005DFF',
  accent_error: '#FF3842',
  accent_green: '#20E070',
  accent_info: '#1FE06F',
  accent_red: '#FF3742',
  bg_gradient_end: '#F7F7F7',
  bg_gradient_start: '#FCFCFC',
  bg_user: '#F7F7F8',
  black: '#000000',
  blue_alice: '#E9F2FF',
  border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
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
    errorButtonText: TextStyle;
    errorContainer: ViewStyle;
    errorText: TextStyle;
    image: ViewStyle;
    imageOverlay: ViewStyle;
    imageOverlaySelectedComponent: {
      check: ViewStyle;
    };
  };
  attachmentSelectionBar: {
    container: ViewStyle;
    icon: ViewStyle;
  };
  audioAttachment: {
    container: ViewStyle;
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
  channelListSkeleton: {
    animationTime: number;
    background: ViewStyle;
    container: ViewStyle;
    gradientStart: StopProps;
    gradientStop: StopProps;
    height: number;
    maskFillColor?: ColorValue;
  };
  channelPreview: {
    avatar: {
      size: number;
    };
    checkAllIcon: IconProps;
    checkIcon: IconProps;
    container: ViewStyle;
    contentContainer: ViewStyle;
    date: TextStyle;
    mutedStatus: {
      height: number;
      iconStyle: ViewStyle;
      width: number;
    };
    message: {
      container: ViewStyle;
    };
    row: ViewStyle;
    title: TextStyle;
    unreadContainer: ViewStyle;
    unreadText: TextStyle;
  };
  colors: typeof Colors & { [key: string]: string };
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
      leftContainer: ViewStyle;
      rightContainer: ViewStyle;
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
      leftContainer: ViewStyle;
      rightContainer: ViewStyle;
      usernameText: TextStyle;
    };
    videoControl: {
      durationTextStyle: TextStyle;
      progressDurationText: TextStyle;
      roundedView: ViewStyle;
      videoContainer: ViewStyle;
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
    attachmentSeparator: ViewStyle;
    attachmentUnsupportedIndicator: {
      container: ViewStyle;
      warningIcon: IconProps;
      text: TextStyle;
    };
    attachmentUploadPreviewList: {
      filesFlatList: ViewStyle;
      imagesFlatList: ViewStyle;
      wrapper: ViewStyle;
    };
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
    audioRecordingButton: {
      container: ViewStyle;
      micIcon: IconProps;
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
    autoCompleteInputContainer: ViewStyle;
    commandInput: {
      closeButton: ViewStyle;
      container: ViewStyle;
      text: TextStyle;
    };
    commandsButton: ViewStyle;
    composerContainer: ViewStyle;
    container: ViewStyle;
    cooldownTimer: {
      container: ViewStyle;
      text: TextStyle;
    };
    dismissAttachmentUpload: {
      dismiss: ViewStyle;
      dismissIcon: IconProps;
      dismissIconColor: ColorValue;
    };
    editingBoxContainer: ViewStyle;
    editingBoxHeader: ViewStyle;
    editingBoxHeaderTitle: TextStyle;
    editingStateHeader: {
      editingBoxHeader: ViewStyle;
      editingBoxHeaderTitle: TextStyle;
    };
    fileAttachmentUploadPreview: {
      fileContainer: ViewStyle;
      filenameText: TextStyle;
      fileSizeText: TextStyle;
      fileTextContainer: ViewStyle;
      uploadProgressOverlay: ViewStyle;
      wrapper: ViewStyle;
    };
    fileUploadPreview: {
      flatList: ViewStyle;
    };
    focusedInputBoxContainer: ViewStyle;
    imageAttachmentUploadPreview: {
      itemContainer: ViewStyle;
      upload: ImageStyle;
    };
    imageUploadPreview: {
      flatList: ViewStyle;
    };
    inputBox: TextStyle;
    inputBoxContainer: ViewStyle;
    micButtonContainer: ViewStyle;
    moreOptionsButton: ViewStyle;
    nativeAttachmentPicker: {
      buttonContainer: ViewStyle;
      buttonDimmerStyle: ViewStyle;
      container: ViewStyle;
    };
    optionsContainer: ViewStyle;
    replyContainer: ViewStyle;
    searchIcon: IconProps;
    sendButton: ViewStyle;
    sendButtonContainer: ViewStyle;
    sendMessageDisallowedIndicator: {
      container: ViewStyle;
      text: TextStyle;
    };
    sendRightIcon: IconProps;
    sendUpIcon: IconProps;
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
    uploadProgressIndicator: {
      container: ViewStyle;
      indicatorColor: string;
      overlay: ViewStyle;
    };
    videoAttachmentUploadPreview: {
      recorderIconContainer: ViewStyle;
      recorderIcon: IconProps;
      itemContainer: ViewStyle;
      upload: ImageStyle;
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
    messageSystem: {
      container: ViewStyle;
      dateText: TextStyle;
      line: ViewStyle;
      text: TextStyle;
      textContainer: ViewStyle;
    };
    scrollToBottomButton: {
      container: ViewStyle;
      touchable: ViewStyle;
      unreadCountNotificationContainer: ViewStyle;
      unreadCountNotificationText: TextStyle;
      wrapper: ViewStyle;
      chevronColor?: ColorValue;
    };
    typingIndicatorContainer: ViewStyle;
    unreadMessagesNotification: {
      closeButtonContainer: ViewStyle;
      closeIcon: IconProps;
      container: ViewStyle;
      text: TextStyle;
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
      filledColor: ColorValue;
      unfilledColor: ColorValue;
    };
    reactionPicker: {
      buttonContainer: ViewStyle;
      container: ViewStyle;
      contentContainer: ViewStyle;
      reactionIconSize: number;
    };
    userReactions: {
      avatarContainer: ViewStyle;
      avatarInnerContainer: ViewStyle;
      avatarName: TextStyle;
      avatarNameContainer: ViewStyle;
      avatarSize: number;
      container: ViewStyle;
      contentContainer: ViewStyle;
      filledBackgroundColor: ColorValue;
      flatlistColumnContainer: ViewStyle;
      flatlistContainer: ViewStyle;
      iconFilledColor: ColorValue;
      iconUnFilledColor: ColorValue;
      radius: number;
      reactionBubble: ViewStyle;
      reactionBubbleBackground: ViewStyle;
      reactionBubbleBorderRadius: number;
      reactionSelectorContainer: ViewStyle;
      reactionsText: TextStyle;
      title: TextStyle;
      unfilledBackgroundColor: ColorValue;
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
      leftAlign: ViewStyle;
      rightAlign: ViewStyle;
      spacer: ViewStyle;
    };
    card: {
      authorName: TextStyle;
      authorNameContainer: ViewStyle;
      authorNameFooter: TextStyle;
      authorNameFooterContainer: ViewStyle;
      authorNameMask: ViewStyle;
      container: ViewStyle;
      cover: ImageStyle;
      footer: ViewStyle & {
        description: TextStyle;
        title: TextStyle;
      };
      noURI: ViewStyle;
      playButtonStyle: {
        durationTextStyle: TextStyle;
        roundedView: ViewStyle;
        videoContainer: ViewStyle;
      };
      playIcon: IconProps;
    };
    container: ViewStyle;
    content: {
      container: ViewStyle & {
        borderRadiusL: ViewStyle['borderBottomLeftRadius' | 'borderTopLeftRadius'];
        borderRadiusS: ViewStyle['borderBottomRightRadius' | 'borderTopRightRadius'];
      };
      containerInner: ViewStyle;
      deletedContainer: ViewStyle;
      deletedContainerInner: ViewStyle;
      deletedMetaText: TextStyle;
      deletedText: MarkdownStyle;
      editedLabel: TextStyle;
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
      messageUser: TextStyle;
      metaContainer: ViewStyle;
      metaText: TextStyle;
      replyBorder: ViewStyle;
      replyContainer: ViewStyle;
      textContainer: ViewStyle & {
        onlyEmojiMarkdown: MarkdownStyle;
      };
      wrapper: ViewStyle;
      receiverMessageBackgroundColor?: ColorValue;
      senderMessageBackgroundColor?: ColorValue;
      timestampText?: TextStyle;
    };
    contentWrapper: ViewStyle;
    file: {
      container: ViewStyle;
      details: ViewStyle;
      fileSize: TextStyle;
      icon: IconProps;
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
      buttonContainer: ViewStyle;
      cancel: TextStyle;
      container: ViewStyle;
      giphy: ImageStyle;
      giphyContainer: ViewStyle;
      giphyHeaderText: TextStyle;
      giphyHeaderTitle: TextStyle;
      giphyMask: ViewStyle;
      giphyMaskText: TextStyle;
      header: ViewStyle;
      selectionContainer: ViewStyle;
      send: TextStyle;
      shuffle: TextStyle;
      title: TextStyle;
    };
    headerWrapper: ViewStyle;
    lastMessageContainer: ViewStyle;
    loadingIndicator: {
      container: ViewStyle;
      roundedView: ViewStyle;
    };
    messageGroupedSingleOrBottomContainer: ViewStyle;
    messageGroupedTopContainer: ViewStyle;
    pinnedHeader: {
      container: ViewStyle;
      label: TextStyle;
    };
    reactionListBottom: {
      contentContainer: ViewStyle;
      item: {
        container: ViewStyle;
        countText: TextStyle;
        filledBackgroundColor: ColorValue;
        icon: ViewStyle;
        iconFillColor: ColorValue;
        iconSize: number;
        iconUnFillColor: ColorValue;
        unfilledBackgroundColor: ColorValue;
      };
    };
    reactionListTop: {
      container: ViewStyle;
      item: {
        container: ViewStyle;
        icon: ViewStyle;
        iconFillColor: ColorValue;
        iconSize: number;
        iconUnFillColor: ColorValue;
        reactionSize: number;
      };
      position: number;
    };
    replies: {
      avatar: ViewStyle;
      avatarContainerMultiple: ViewStyle;
      avatarContainerSingle: ViewStyle;
      container: ViewStyle;
      leftAvatarsContainer: ViewStyle;
      leftCurve: ViewStyle;
      messageRepliesText: TextStyle;
      rightAvatarsContainer: ViewStyle;
      rightCurve: ViewStyle;
      avatarSize?: number;
    };
    status: {
      checkAllIcon: IconProps;
      checkIcon: IconProps;
      readByCount: TextStyle;
      statusContainer: ViewStyle;
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
      buttonContainer: ViewStyle;
      container: ViewStyle;
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
        wrapper: ViewStyle;
      };
      anonymousPoll: {
        title: TextStyle;
        wrapper: ViewStyle;
      };
      headerContainer: ViewStyle;
      maxVotes: {
        input: TextStyle;
        validationText: TextStyle;
        wrapper: ViewStyle;
      };
      multipleAnswers: {
        row: ViewStyle;
        title: TextStyle;
        wrapper: ViewStyle;
      };
      name: {
        input: TextStyle;
        title: TextStyle;
      };
      pollOptions: {
        addOption: {
          text: TextStyle;
          wrapper: ViewStyle;
        };
        container: ViewStyle;
        optionStyle: {
          input: TextStyle;
          validationErrorText: TextStyle;
          wrapper: ViewStyle;
        };
        title: TextStyle;
      };
      scrollView: ViewStyle;
      sendButton: ViewStyle;
      suggestOption: {
        title: TextStyle;
        wrapper: ViewStyle;
      };
    };
    fullResults: {
      container: ViewStyle;
      contentContainer: ViewStyle;
      headerContainer: ViewStyle;
      headerText: TextStyle;
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
        progressBar: ViewStyle;
        progressBarEmptyFill: string;
        progressBarVotedFill: string;
        progressBarWinnerFill: string;
        text: TextStyle;
        voteButtonActive: string;
        voteButtonContainer: ViewStyle;
        voteButtonInactive: string;
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
        voteCount: TextStyle;
      };
      scrollView: ViewStyle;
      title: TextStyle;
      vote: { container: ViewStyle; dateText: TextStyle; userName: TextStyle };
    };
  };
  progressControl: {
    container: ViewStyle;
    filledColor: ColorValue;
    filledStyles: ViewStyle;
    thumb: ViewStyle;
  };
  reply: {
    container: ViewStyle;
    fileAttachmentContainer: ViewStyle;
    imageAttachment: ImageStyle;
    markdownStyles: MarkdownStyle;
    messageContainer: ViewStyle;
    secondaryText: ViewStyle;
    textContainer: ViewStyle;
    videoThumbnail: {
      container: ViewStyle;
      image: ImageStyle;
    };
  };
  screenPadding: number;
  spinner: ViewStyle;
  thread: {
    newThread: ViewStyle & {
      text: TextStyle;
      backgroundGradientStart?: string;
      backgroundGradientStop?: string;
      threadHeight?: number;
    };
  };
  threadListItem: {
    boldText: TextStyle;
    contentRow: ViewStyle;
    contentTextWrapper: ViewStyle;
    dateText: TextStyle;
    headerRow: ViewStyle;
    infoRow: ViewStyle;
    parentMessagePreviewContainer: ViewStyle;
    parentMessageText: TextStyle;
    previewMessageContainer: ViewStyle;
    touchableWrapper: ViewStyle;
    unreadBubbleText: TextStyle;
    unreadBubbleWrapper: ViewStyle;
  };
  threadListUnreadBanner: {
    text: TextStyle;
    touchableWrapper: ViewStyle;
  };
  typingIndicator: {
    container: ViewStyle;
    text: TextStyle & {
      fontSize: TextStyle['fontSize'];
    };
  };
  waveProgressBar: {
    container: ViewStyle;
    thumb: ViewStyle;
    waveform: ViewStyle;
  };
};

export const defaultTheme: Theme = {
  aiTypingIndicatorView: {
    container: {},
    text: {},
  },
  attachmentPicker: {
    bottomSheetContentContainer: {},
    durationText: {},
    errorButtonText: {},
    errorContainer: {},
    errorText: {},
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
  channelListSkeleton: {
    animationTime: 1800, // in milliseconds
    background: {},
    container: {},
    gradientStart: {
      stopOpacity: 0,
    },
    gradientStop: {
      stopOpacity: 0.5,
    },
    height: 64,
  },
  channelPreview: {
    avatar: {
      size: 40,
    },
    checkAllIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    checkIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    container: {},
    contentContainer: {},
    date: {},
    message: {
      container: {},
    },
    mutedStatus: {
      height: 20,
      iconStyle: {},
      width: 20,
    },
    row: {},
    title: {},
    unreadContainer: {},
    unreadText: {},
  },
  colors: {
    ...Colors,
  },
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
      leftContainer: {},
      rightContainer: {},
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
      leftContainer: {},
      rightContainer: {},
      usernameText: {},
    },
    videoControl: {
      durationTextStyle: {},
      progressDurationText: {},
      roundedView: {},
      videoContainer: {},
    },
  },
  inlineDateSeparator: {
    container: {},
    text: {},
  },
  loadingDots: {
    container: {},
    loadingDot: {},
    spacing: 4,
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
    attachmentSeparator: {},
    attachmentUnsupportedIndicator: {
      container: {},
      text: {},
      warningIcon: {},
    },
    attachmentUploadPreviewList: {
      filesFlatList: {},
      imagesFlatList: {},
      wrapper: {},
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
    audioRecordingButton: { container: {}, micIcon: {} },
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
    autoCompleteInputContainer: {},
    commandInput: {
      closeButton: {},
      container: {},
      text: {},
    },
    commandsButton: {},
    composerContainer: {},
    container: {},
    cooldownTimer: {
      container: {},
      text: {},
    },
    dismissAttachmentUpload: {
      dismiss: {},
      dismissIcon: {},
      dismissIconColor: '',
    },
    editingBoxContainer: {},
    editingBoxHeader: {},
    editingBoxHeaderTitle: {},
    editingStateHeader: {
      editingBoxHeader: {},
      editingBoxHeaderTitle: {},
    },
    fileAttachmentUploadPreview: {
      fileContainer: {},
      filenameText: {},
      fileSizeText: {},
      fileTextContainer: {},
      uploadProgressOverlay: {},
      wrapper: {},
    },
    fileUploadPreview: {
      flatList: {},
    },
    focusedInputBoxContainer: {},
    imageAttachmentUploadPreview: {
      itemContainer: {},
      upload: {},
    },
    imageUploadPreview: {
      flatList: {},
    },
    inputBox: {},
    inputBoxContainer: {},
    micButtonContainer: {},
    moreOptionsButton: {},
    nativeAttachmentPicker: {
      buttonContainer: {},
      buttonDimmerStyle: {},
      container: {},
    },
    optionsContainer: {},
    replyContainer: {},
    searchIcon: {},
    sendButton: {},
    sendButtonContainer: {},
    sendMessageDisallowedIndicator: {
      container: {},
      text: {},
    },
    sendRightIcon: {},
    sendUpIcon: {},
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
    uploadProgressIndicator: {
      container: {},
      indicatorColor: '',
      overlay: {},
    },
    videoAttachmentUploadPreview: {
      itemContainer: {},
      recorderIcon: {},
      recorderIconContainer: {},
      upload: {},
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
    messageSystem: {
      container: {},
      dateText: {},
      line: {},
      text: {},
      textContainer: {},
    },
    scrollToBottomButton: {
      container: {},
      touchable: {},
      unreadCountNotificationContainer: {},
      unreadCountNotificationText: {},
      wrapper: {},
    },
    typingIndicatorContainer: {},
    unreadMessagesNotification: {
      closeButtonContainer: {},
      closeIcon: {},
      container: {},
      text: {},
    },
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
    reactionButton: {
      filledColor: Colors.accent_blue,
      unfilledColor: Colors.grey,
    },
    reactionPicker: {
      buttonContainer: {},
      container: {},
      contentContainer: {},
      reactionIconSize: 24,
    },
    userReactions: {
      avatarContainer: {},
      avatarInnerContainer: {},
      avatarName: {},
      avatarNameContainer: {},
      avatarSize: 64,
      container: {},
      contentContainer: {},
      filledBackgroundColor: Colors.light_blue,
      flatlistColumnContainer: {},
      flatlistContainer: {},
      iconFilledColor: Colors.accent_blue,
      iconUnFilledColor: Colors.grey,
      radius: 2,
      reactionBubble: {},
      reactionBubbleBackground: {},
      reactionBubbleBorderRadius: 24,
      reactionSelectorContainer: {},
      reactionsText: {},
      title: {},
      unfilledBackgroundColor: Colors.grey_gainsboro,
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
      leftAlign: {
        marginRight: 8,
      },
      rightAlign: {
        marginLeft: 8,
      },
      spacer: {
        height: BASE_AVATAR_SIZE,
        width: BASE_AVATAR_SIZE, // same as BASE_AVATAR_SIZE
      },
    },
    card: {
      authorName: {},
      authorNameContainer: {},
      authorNameFooter: {},
      authorNameFooterContainer: {},
      authorNameMask: {},
      container: {},
      cover: {},
      footer: {
        description: {},
        title: {
          fontWeight: '700',
        },
      },
      noURI: {
        borderLeftWidth: 2,
        paddingLeft: 8,
      },
      playButtonStyle: {
        durationTextStyle: {},
        roundedView: {},
        videoContainer: {},
      },
      playIcon: {
        height: 32,
        width: 32,
      },
    },
    container: {},
    content: {
      container: {
        borderRadiusL: 16,
        borderRadiusS: 0,
      },
      containerInner: {},
      deletedContainer: {},
      deletedContainerInner: {},
      deletedMetaText: {
        paddingHorizontal: 5,
      },
      deletedText: {
        em: {
          fontSize: 15,
          fontStyle: 'italic',
          fontWeight: '400',
        },
      },
      editedLabel: {},
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
      messageUser: {
        fontSize: 12,
        fontWeight: '700',
        paddingRight: 6,
      },
      metaContainer: {},
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
    contentWrapper: {},
    file: {
      container: {},
      details: {},
      fileSize: {},
      icon: {},
      title: {},
    },
    fileAttachmentGroup: {
      attachmentContainer: {},
      container: {},
    },
    gallery: {
      galleryContainer: {},
      galleryItemColumn: {},
      gridHeight: 195,
      gridWidth: 256,
      image: {},
      imageBorderRadius: undefined,
      imageContainer: {},
      imageContainerStyle: {},
      maxHeight: 300,
      maxWidth: 256,
      minHeight: 100,
      minWidth: 170,
      moreImagesContainer: {},
      moreImagesText: {},
      thumbnail: {},
    },
    giphy: {
      buttonContainer: {},
      cancel: {},
      container: {},
      giphy: {},
      giphyContainer: {},
      giphyHeaderText: {},
      giphyHeaderTitle: {},
      giphyMask: {},
      giphyMaskText: {},
      header: {},
      selectionContainer: {},
      send: {},
      shuffle: {},
      title: {},
    },
    headerWrapper: {},
    lastMessageContainer: {},
    loadingIndicator: {
      container: {},
      roundedView: {},
    },
    messageGroupedSingleOrBottomContainer: {},
    messageGroupedTopContainer: {},
    pinnedHeader: {
      container: {},
      label: {},
    },
    reactionListBottom: {
      contentContainer: {},
      item: {
        container: {},
        countText: {},
        filledBackgroundColor: Colors.light_blue,
        icon: {},
        iconFillColor: Colors.accent_blue,
        iconSize: 16,
        iconUnFillColor: Colors.grey,
        unfilledBackgroundColor: Colors.grey_gainsboro,
      },
    },
    reactionListTop: {
      container: {},
      item: {
        container: {},
        icon: {},
        iconFillColor: Colors.accent_blue,
        iconSize: 24,
        iconUnFillColor: Colors.grey,
        reactionSize: 24,
      },
      position: 16,
    },
    replies: {
      avatar: {},
      avatarContainerMultiple: {},
      avatarContainerSingle: {},
      container: {},
      leftAvatarsContainer: {},
      leftCurve: {},
      messageRepliesText: {},
      rightAvatarsContainer: {},
      rightCurve: {},
    },
    status: {
      checkAllIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      checkIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      readByCount: {},
      statusContainer: {},
      timeIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
    },
    swipeContentContainer: {},
    swipeLeftContent: {
      container: {},
    },
    targetedMessageContainer: {},
    unreadUnderlayColor: Colors.bg_gradient_start,
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
      buttonContainer: {},
      container: {},
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
        wrapper: {},
      },
      anonymousPoll: {
        title: {},
        wrapper: {},
      },
      headerContainer: {},
      maxVotes: {
        input: {},
        validationText: {},
        wrapper: {},
      },
      multipleAnswers: {
        row: {},
        title: {},
        wrapper: {},
      },
      name: {
        input: {},
        title: {},
      },
      pollOptions: {
        addOption: {
          text: {},
          wrapper: {},
        },
        container: {},
        optionStyle: {
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
        wrapper: {},
      },
    },
    fullResults: {
      container: {},
      contentContainer: {},
      headerContainer: {},
      headerText: {},
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
        progressBar: {},
        progressBarEmptyFill: '',
        progressBarVotedFill: '',
        progressBarWinnerFill: '',
        text: {},
        voteButtonActive: '',
        voteButtonContainer: {},
        voteButtonInactive: '',
        votesContainer: {},
        wrapper: {},
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
        voteCount: {},
      },
      scrollView: {},
      title: {},
      vote: { container: {}, dateText: {}, userName: {} },
    },
  },
  progressControl: {
    container: {},
    filledColor: '',
    filledStyles: {},
    thumb: {},
  },
  reply: {
    container: {},
    fileAttachmentContainer: {},
    imageAttachment: {},
    markdownStyles: {},
    messageContainer: {},
    secondaryText: {},
    textContainer: {},
    videoThumbnail: {
      container: {},
      image: {},
    },
  },
  screenPadding: 8,
  spinner: {},
  thread: {
    newThread: {
      text: {},
    },
  },
  threadListItem: {
    boldText: {},
    contentRow: {},
    contentTextWrapper: {},
    dateText: {},
    headerRow: {},
    infoRow: {},
    parentMessagePreviewContainer: {},
    parentMessageText: {},
    previewMessageContainer: {},
    touchableWrapper: {},
    unreadBubbleText: {},
    unreadBubbleWrapper: {},
  },
  threadListUnreadBanner: {
    text: {},
    touchableWrapper: {},
  },
  typingIndicator: {
    container: {},
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
