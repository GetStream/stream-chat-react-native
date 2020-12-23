import { vh } from '../../../utils/utils';

import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { CircleProps, StopProps } from 'react-native-svg';

import type { IconProps } from '../../../icons/utils/base';

export const DEFAULT_STATUS_ICON_SIZE = 16;

export const Colors = {
  accent_blue: '#005FFF',
  accent_green: '#20E070',
  accent_red: '#FF3742',
  bg_gradient_end: '#F7F7F7',
  bg_gradient_start: '#FCFCFC',
  black: '#000000',
  blue_alice: '#E9F2FF',
  border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
  grey: '#7A7A7A',
  grey_gainsboro: '#DBDBDB',
  grey_whisper: '#ECEBEB',
  modal_shadow: '#00000099', // 99 = 60% opacity; x=0, y= 1, radius=4
  overlay: '#00000033', // 33 = 20% opacity
  overlay_dark: '#00000099', // 99 = 60% opacity
  shadow_icon: '#00000040', // 40 = 25% opacity; x=0, y=0, radius=4
  targetedMessageBackground: '#FBF4DD', // dark mode = #302D22
  transparent: 'transparent',
  white: '#FFFFFF',
  white_smoke: '#F2F2F2',
  white_snow: '#FCFCFC',
};

export type MarkdownStyle = Partial<{
  autolink: StyleProp<TextStyle>;
  blockQuoteBar: StyleProp<ViewStyle>;
  blockQuoteSection: StyleProp<ViewStyle>;
  blockQuoteSectionBar: StyleProp<ViewStyle>;
  blockQuoteText: StyleProp<TextStyle | ViewStyle>;
  br: StyleProp<TextStyle>;
  codeBlock: StyleProp<TextStyle>;
  del: StyleProp<TextStyle>;
  em: StyleProp<TextStyle>;
  heading: StyleProp<TextStyle>;
  heading1: StyleProp<TextStyle>;
  heading2: StyleProp<TextStyle>;
  heading3: StyleProp<TextStyle>;
  heading4: StyleProp<TextStyle>;
  heading5: StyleProp<TextStyle>;
  heading6: StyleProp<TextStyle>;
  hr: StyleProp<ViewStyle>;
  image: StyleProp<ImageStyle>;
  inlineCode: StyleProp<TextStyle>;
  list: StyleProp<ViewStyle>;
  listItem: StyleProp<ViewStyle>;
  listItemBullet: StyleProp<TextStyle>;
  listItemNumber: StyleProp<TextStyle>;
  listItemText: StyleProp<TextStyle>;
  listRow: StyleProp<ViewStyle>;
  mailTo: StyleProp<TextStyle>;
  mentions: StyleProp<TextStyle>;
  newline: StyleProp<TextStyle>;
  noMargin: StyleProp<TextStyle>;
  paragraph: StyleProp<TextStyle>;
  paragraphCenter: StyleProp<TextStyle>;
  paragraphWithImage: StyleProp<ViewStyle>;
  strong: StyleProp<TextStyle>;
  sublist: StyleProp<ViewStyle>;
  table: StyleProp<ViewStyle>;
  tableHeader: StyleProp<ViewStyle>;
  tableHeaderCell: StyleProp<TextStyle>;
  tableRow: StyleProp<ViewStyle>;
  tableRowCell: StyleProp<ViewStyle>;
  tableRowLast: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  u: StyleProp<TextStyle>;
  view: StyleProp<ViewStyle>;
}>;

export type Theme = {
  attachmentPicker: {
    bottomSheetContentContainer: ViewStyle;
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
  avatar: {
    BASE_AVATAR_SIZE: number;
    container: ViewStyle;
    image: ImageStyle;
    presenceIndicator: CircleProps;
    presenceIndicatorContainer: ViewStyle;
  };
  channel: {
    selectChannel: TextStyle;
  };
  channelInfoOverlay: {
    avatarPresenceIndicator: CircleProps;
    avatarPresenceIndicatorStyle: ViewStyle;
    avatarSize: number;
    channelName: TextStyle;
    channelStatus: TextStyle;
    container: ViewStyle;
    containerInner: ViewStyle;
    deleteRow: ViewStyle;
    deleteText: TextStyle;
    detailsContainer: ViewStyle;
    flatList: ViewStyle;
    flatListContent: ViewStyle;
    leaveGroupRow: ViewStyle;
    leaveGroupText: TextStyle;
    row: ViewStyle;
    rowInner: ViewStyle;
    userItemContainer: ViewStyle;
    userName: TextStyle;
  };
  channelListFooterLoadingIndicator: {
    container: ViewStyle;
  };
  channelListHeaderErrorIndicator: {
    container: ViewStyle;
    errorText: TextStyle;
  };
  channelListMessenger: {
    flatList: ViewStyle;
    flatListContent: ViewStyle;
    header: ViewStyle;
    searchContainer: ViewStyle;
    searchInput: TextStyle;
  };
  channelListSkeleton: {
    animationTime: number;
    background: ViewStyle;
    container: ViewStyle;
    gradientStart: StopProps;
    gradientStop: StopProps;
    height: number;
  };
  channelPreview: {
    checkAllIcon: IconProps;
    checkIcon: IconProps;
    container: ViewStyle;
    contentContainer: ViewStyle;
    date: TextStyle;
    leftSwipeableButton: ViewStyle;
    message: TextStyle & {
      color: TextStyle['color'];
      fontWeight: TextStyle['fontWeight'];
    };
    rightSwipeableButton: ViewStyle;
    row: ViewStyle;
    swipeableContainer: ViewStyle;
    title: TextStyle;
    unreadContainer: ViewStyle;
    unreadText: TextStyle;
  };
  colors: typeof Colors;
  dateHeader: {
    container: ViewStyle;
    text: TextStyle;
  };
  emptyStateIndicator: {
    channelContainer: ViewStyle;
    channelDetails: TextStyle;
    channelTitle: TextStyle;
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
    backgroundColor: string;
    blurType: 'light' | 'dark';
    footer: {
      centerContainer: ViewStyle;
      container: ViewStyle;
      imageCountText: TextStyle;
      innerContainer: ViewStyle;
      leftContainer: ViewStyle;
      rightContainer: ViewStyle;
    };
    grid: {
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
    autoCompleteInputContainer: ViewStyle;
    commandsButton: ViewStyle;
    commandsButtonContainer: ViewStyle;
    composerContainer: ViewStyle;
    container: ViewStyle;
    editingBoxContainer: ViewStyle;
    editingBoxHeader: ViewStyle;
    editingBoxHeaderTitle: TextStyle;
    fileUploadPreview: {
      dismiss: ViewStyle;
      fileContainer: ViewStyle;
      fileContentContainer: ViewStyle;
      filenameText: TextStyle;
      fileSizeText: TextStyle;
      fileTextContainer: ViewStyle;
      flatList: ViewStyle;
    };
    giphyContainer: ViewStyle;
    giphyText: TextStyle;
    imageUploadPreview: {
      dismiss: ViewStyle;
      flatList: ViewStyle;
      itemContainer: ViewStyle;
      upload: ImageStyle;
    };
    inputBox: TextStyle;
    inputBoxContainer: ViewStyle;
    moreOptionsButton: ViewStyle;
    optionsContainer: ViewStyle;
    replyContainer: ViewStyle;
    sendButton: ViewStyle;
    sendButtonContainer: ViewStyle;
    showThreadMessageInChannelButton: {
      check: IconProps;
      checkBoxActive: ViewStyle;
      checkBoxInactive: ViewStyle;
      container: ViewStyle;
      innerContainer: ViewStyle;
      text: TextStyle;
    };
    suggestions: {
      command: {
        args: TextStyle;
        container: ViewStyle;
        iconContainer: ViewStyle;
        title: TextStyle;
      };
      commandsHeader: {
        container: ViewStyle;
        title: TextStyle;
      };
      container: ViewStyle & {
        maxHeight: number;
      };
      emoji: {
        container: ViewStyle;
        text: TextStyle;
      };
      emojisHeader: {
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
      title: TextStyle;
    };
    suggestionsListContainer: ViewStyle;
    uploadProgressIndicator: {
      container: ViewStyle;
      overlay: ViewStyle;
    };
  };
  messageList: {
    container: ViewStyle;
    errorNotification: ViewStyle;
    errorNotificationText: TextStyle;
    inlineUnreadIndicator: {
      container: ViewStyle;
      text: TextStyle;
    };
    listContainer: ViewStyle;
    messageNotification: {
      container: ViewStyle;
      touchable: ViewStyle;
      unreadCountNotificationContainer: ViewStyle;
      unreadCountNotificationText: TextStyle;
      wrapper: ViewStyle;
    };
    messageSystem: {
      container: ViewStyle;
      dateText: TextStyle;
      line: ViewStyle;
      text: TextStyle;
      textContainer: ViewStyle;
    };
    targetedMessageUnderlay: ViewStyle;
    typingIndicatorContainer: ViewStyle;
  };
  messageSimple: {
    actions: {
      button: ViewStyle & {
        defaultBackgroundColor: ViewStyle['backgroundColor'];
        defaultBorderColor: ViewStyle['borderColor'];
        primaryBackgroundColor: ViewStyle['backgroundColor'];
        primaryBorderColor: ViewStyle['borderColor'];
      };
      buttonText: TextStyle & {
        defaultColor: TextStyle['color'];
        primaryColor: TextStyle['color'];
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
    };
    container: ViewStyle;
    content: {
      container: ViewStyle & {
        borderRadiusL: ViewStyle[
          | 'borderBottomLeftRadius'
          | 'borderTopLeftRadius'];
        borderRadiusS: ViewStyle[
          | 'borderBottomRightRadius'
          | 'borderTopRightRadius'];
      };
      containerInner: ViewStyle;
      deletedContainer: ViewStyle;
      deletedMetaText: TextStyle;
      deletedText: MarkdownStyle;
      errorContainer: ViewStyle;
      errorIcon: IconProps;
      errorIconContainer: ViewStyle;
      eyeIcon: IconProps;
      /**
       * Available options for styling text:
       * https://github.com/andangrd/react-native-markdown-package/blob/master/styles.js
       */
      markdown: MarkdownStyle;
      messageUser: TextStyle;
      metaContainer: ViewStyle;
      metaText: TextStyle;
      textContainer: ViewStyle & {
        onlyEmojiMarkdown: MarkdownStyle;
      };
    };
    file: {
      container: ViewStyle;
      details: ViewStyle;
      fileSize: TextStyle;
      icon: IconProps;
      title: TextStyle;
    };
    fileAttachmentGroup: {
      container: ViewStyle;
    };
    gallery: {
      galleryContainer: ViewStyle;
      galleryItemColumn: ViewStyle;
      halfSize: ViewStyle['height'];
      image: ImageStyle;
      imageContainer: ViewStyle;
      moreImagesContainer: ViewStyle;
      moreImagesText: TextStyle;
      size: ViewStyle['height'];
      width: ViewStyle['width'];
    };
    giphy: {
      cancel: TextStyle;
      cancelContainer: ViewStyle;
      container: ViewStyle;
      giphy: ImageStyle;
      giphyContainer: ViewStyle;
      giphyMask: ViewStyle;
      giphyText: TextStyle;
      selectionContainer: ViewStyle;
      selector: ViewStyle;
      send: TextStyle;
      sendContainer: ViewStyle;
      shuffleButton: ViewStyle;
      title: TextStyle;
    };
    reactionList: {
      container: ViewStyle;
      middleIcon: ViewStyle;
      radius: number;
      reactionBubble: ViewStyle;
      reactionBubbleBackground: ViewStyle;
      reactionSize: number;
      strokeSize: number;
    };
    replies: {
      container: ViewStyle;
      messageRepliesText: TextStyle;
    };
    status: {
      checkAllIcon: IconProps;
      checkIcon: IconProps;
      readByCount: TextStyle;
      statusContainer: ViewStyle;
      timeIcon: IconProps;
    };
  };
  overlay: {
    padding: number;
    reactions: {
      avatarContainer: ViewStyle;
      avatarName: TextStyle;
      avatarSize: number;
      container: ViewStyle;
      flatListContainer: ViewStyle;
      radius: number;
      reactionBubble: ViewStyle;
      reactionBubbleBackground: ViewStyle;
      title: TextStyle;
    };
    reactionsList: {
      radius: number;
      reaction: ViewStyle;
      reactionList: ViewStyle;
    };
  };
  reply: {
    container: ViewStyle;
    fileAttachmentContainer: ViewStyle;
    imageAttachment: ImageStyle;
    markdownStyles: MarkdownStyle;
    messageContainer: ViewStyle;
    textContainer: ViewStyle;
  };
  screenPadding: number;
  spinner: ViewStyle;
  thread: {
    newThread: ViewStyle & {
      backgroundGradientStart: string;
      backgroundGradientStop: string;
      text: TextStyle;
    };
  };
  typingIndicator: {
    container: ViewStyle;
    text: TextStyle & {
      color: TextStyle['color'];
      fontSize: TextStyle['fontSize'];
    };
  };
};

export const defaultTheme: Theme = {
  attachmentPicker: {
    bottomSheetContentContainer: {
      backgroundColor: Colors.white,
    },
    errorButtonText: {
      color: Colors.accent_blue,
    },
    errorContainer: {
      backgroundColor: Colors.white_smoke,
    },
    errorText: {
      color: Colors.grey,
    },
    image: {},
    imageOverlay: {
      backgroundColor: Colors.overlay,
    },
    imageOverlaySelectedComponent: {
      check: {
        backgroundColor: Colors.white,
      },
    },
  },
  attachmentSelectionBar: {
    container: {},
    icon: {},
  },
  avatar: {
    BASE_AVATAR_SIZE: 32,
    container: {},
    image: {
      borderRadius: 16,
      height: 32,
      width: 32,
    },
    presenceIndicator: {
      cx: 8,
      cy: 4,
      fill: Colors.accent_green,
      r: 4,
      stroke: Colors.white,
      strokeWidth: 2,
    },
    presenceIndicatorContainer: {},
  },
  channel: {
    selectChannel: {},
  },
  channelInfoOverlay: {
    avatarPresenceIndicator: { cx: 6, cy: 6, r: 6 },
    avatarPresenceIndicatorStyle: {
      right: 4,
      top: 1,
    },
    avatarSize: 64,
    channelName: {
      color: Colors.black,
    },
    channelStatus: {
      color: Colors.grey,
    },
    container: {},
    containerInner: {
      backgroundColor: Colors.white,
    },
    deleteRow: {
      borderBottomColor: Colors.border,
      borderBottomWidth: 1,
    },
    deleteText: { color: Colors.accent_red },
    detailsContainer: {},
    flatList: {},
    flatListContent: {},
    leaveGroupRow: {},
    leaveGroupText: {
      color: Colors.black,
    },
    row: {
      borderTopColor: Colors.border,
    },
    rowInner: {},
    userItemContainer: {},
    userName: {
      color: Colors.black,
    },
  },
  channelListFooterLoadingIndicator: {
    container: {},
  },
  channelListHeaderErrorIndicator: {
    container: {
      backgroundColor: `${Colors.grey}E6`,
    },
    errorText: {
      color: Colors.accent_red,
    },
  },
  channelListMessenger: {
    flatList: {
      backgroundColor: Colors.white_snow,
    },
    flatListContent: {},
    header: {},
    searchContainer: {
      backgroundColor: Colors.white,
      borderColor: Colors.border,
    },
    searchInput: {},
  },
  channelListSkeleton: {
    animationTime: 1000, // in milliseconds
    background: {
      backgroundColor: Colors.grey_whisper,
    },
    container: {
      borderBottomColor: Colors.border,
    },
    gradientStart: {},
    gradientStop: {},
    height: 64,
  },
  channelPreview: {
    checkAllIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      pathFill: Colors.accent_blue,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    checkIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    container: {
      backgroundColor: Colors.white_snow,
      borderBottomColor: Colors.border,
    },
    contentContainer: {},
    date: {
      color: Colors.grey,
    },
    leftSwipeableButton: {},
    message: {
      color: Colors.grey,
      fontWeight: '400',
    },
    rightSwipeableButton: {},
    row: {},
    swipeableContainer: {
      backgroundColor: Colors.white_smoke,
    },
    title: {
      color: Colors.black,
    },
    unreadContainer: {
      backgroundColor: Colors.accent_red,
    },
    unreadText: {
      color: Colors.white,
    },
  },
  colors: {
    ...Colors,
  },
  dateHeader: {
    container: {
      backgroundColor: Colors.overlay_dark,
    },
    text: {
      color: Colors.white,
    },
  },
  emptyStateIndicator: {
    channelContainer: {},
    channelDetails: {
      color: Colors.grey,
    },
    channelTitle: {
      color: Colors.black,
    },
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
    backgroundColor: Colors.white_snow,
    blurType: 'light',
    footer: {
      centerContainer: {},
      container: {
        backgroundColor: Colors.white,
      },
      imageCountText: {
        color: Colors.black,
      },
      innerContainer: {},
      leftContainer: {},
      rightContainer: {},
    },
    grid: {
      contentContainer: {
        backgroundColor: Colors.white,
      },
      gridAvatar: {},
      gridAvatarWrapper: {
        backgroundColor: Colors.white,
      },
      gridImage: {},
      handle: {
        backgroundColor: Colors.white,
      },
      handleText: {
        color: Colors.black,
      },
      overlay: {
        backgroundColor: Colors.overlay,
      },
    },
    header: {
      centerContainer: {},
      container: {
        backgroundColor: Colors.white,
      },
      dateText: {
        color: Colors.black,
      },
      innerContainer: {},
      leftContainer: {},
      rightContainer: {},
      usernameText: {
        color: Colors.black,
      },
    },
  },
  loadingDots: {
    container: {},
    loadingDot: {
      backgroundColor: Colors.black,
    },
    spacing: 4,
  },
  loadingErrorIndicator: {
    container: {},
    errorText: {
      color: Colors.accent_red,
    },
    retryText: {
      color: Colors.black,
    },
  },
  loadingIndicator: {
    container: {},
    loadingText: {
      color: Colors.black,
    },
  },
  messageInput: {
    attachButton: {},
    attachButtonContainer: {},
    attachmentSelectionBar: {
      backgroundColor: Colors.white_smoke,
    },
    autoCompleteInputContainer: {},
    commandsButton: {},
    commandsButtonContainer: {},
    composerContainer: {},
    container: {
      borderColor: Colors.border,
    },
    editingBoxContainer: {},
    editingBoxHeader: {},
    editingBoxHeaderTitle: {
      color: Colors.black,
    },
    fileUploadPreview: {
      dismiss: {
        backgroundColor: Colors.overlay_dark,
      },
      fileContainer: {
        borderColor: Colors.grey_whisper,
      },
      fileContentContainer: {},
      filenameText: {
        color: Colors.black,
      },
      fileSizeText: {
        color: Colors.grey,
      },
      fileTextContainer: {},
      flatList: {},
    },
    giphyContainer: {
      backgroundColor: Colors.accent_blue,
    },
    giphyText: {
      color: Colors.white,
    },
    imageUploadPreview: {
      dismiss: {
        backgroundColor: Colors.overlay_dark,
      },
      flatList: {},
      itemContainer: {},
      upload: {},
    },
    inputBox: {},
    inputBoxContainer: {
      borderColor: Colors.grey_whisper,
    },
    moreOptionsButton: {},
    optionsContainer: {},
    replyContainer: {},
    sendButton: {},
    sendButtonContainer: {},
    showThreadMessageInChannelButton: {
      check: {},
      checkBoxActive: {
        backgroundColor: Colors.accent_blue,
        borderColor: Colors.accent_blue,
      },
      checkBoxInactive: {
        borderColor: Colors.grey,
      },
      container: {},
      innerContainer: {},
      text: {
        color: Colors.grey,
      },
    },
    suggestions: {
      command: {
        args: {
          color: Colors.grey,
        },
        container: {},
        iconContainer: {
          backgroundColor: Colors.accent_blue,
        },
        title: {
          color: Colors.black,
        },
      },
      commandsHeader: {
        container: {},
        title: {
          color: Colors.grey,
        },
      },
      container: {
        maxHeight: vh(25),
      },
      emoji: {
        container: {},
        text: {
          color: Colors.black,
        },
      },
      emojisHeader: {
        container: {},
        title: {
          color: Colors.grey,
        },
      },
      item: {},
      mention: {
        avatarSize: 40,
        column: {},
        container: {},
        name: {
          color: Colors.black,
        },
        tag: {
          color: Colors.grey,
        },
      },
      title: {
        color: Colors.black,
      },
    },
    suggestionsListContainer: {
      backgroundColor: Colors.white,
    },
    uploadProgressIndicator: {
      container: {
        backgroundColor: Colors.overlay,
      },
      overlay: {
        backgroundColor: Colors.overlay,
      },
    },
  },
  messageList: {
    container: {
      backgroundColor: Colors.white_snow,
    },
    errorNotification: {
      backgroundColor: `${Colors.grey_gainsboro}E6`,
    },
    errorNotificationText: {
      color: Colors.accent_red,
    },
    inlineUnreadIndicator: {
      container: {},
      text: {
        color: Colors.grey,
      },
    },
    listContainer: {},
    messageNotification: {
      container: {
        backgroundColor: Colors.white,
        shadowColor: Colors.black,
      },
      touchable: {},
      unreadCountNotificationContainer: {
        backgroundColor: Colors.accent_blue,
      },
      unreadCountNotificationText: {
        color: Colors.white,
      },
      wrapper: {},
    },
    messageSystem: {
      container: {},
      dateText: {
        color: Colors.grey,
      },
      line: {
        backgroundColor: Colors.grey_whisper,
      },
      text: {
        color: Colors.grey,
      },
      textContainer: {},
    },
    targetedMessageUnderlay: {
      backgroundColor: Colors.targetedMessageBackground,
    },
    typingIndicatorContainer: {},
  },
  messageSimple: {
    actions: {
      button: {
        defaultBackgroundColor: Colors.white,
        defaultBorderColor: Colors.transparent,
        primaryBackgroundColor: Colors.accent_blue,
        primaryBorderColor: Colors.border,
      },
      buttonText: {
        defaultColor: Colors.black,
        primaryColor: Colors.white,
      },
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
        height: 28,
        width: 32, // same as BASE_AVATAR_SIZE
      },
    },
    card: {
      authorName: { color: Colors.accent_blue },
      authorNameContainer: { backgroundColor: Colors.blue_alice },
      authorNameFooter: { color: Colors.accent_blue },
      authorNameFooterContainer: { backgroundColor: Colors.transparent },
      authorNameMask: {},
      container: {},
      cover: {},
      footer: {
        description: {
          color: Colors.black,
        },
        title: {
          color: Colors.black,
          fontWeight: '700',
        },
      },
      noURI: {
        borderLeftColor: Colors.accent_blue,
        borderLeftWidth: 2,
        paddingLeft: 8,
      },
    },
    container: {},
    content: {
      container: {
        borderRadiusL: 16,
        borderRadiusS: 0,
      },
      containerInner: {
        borderColor: Colors.grey_whisper,
      },
      deletedContainer: {},
      deletedMetaText: {
        color: Colors.grey,
        paddingHorizontal: 10,
      },
      deletedText: {
        em: {
          color: Colors.grey,
          fontSize: 15,
          fontStyle: 'italic',
          fontWeight: '400',
        },
      },
      errorContainer: {
        paddingRight: 12,
        paddingTop: 0,
      },
      errorIcon: {
        height: 20,
        pathFill: Colors.accent_red,
        width: 20,
      },
      errorIconContainer: {
        bottom: -2,
        position: 'absolute',
        right: -12,
      },
      eyeIcon: {
        height: 16,
        pathFill: Colors.grey,
        width: 16,
      },
      markdown: {
        autolink: {
          color: Colors.accent_blue,
          textDecorationLine: 'underline',
        },
        mentions: {
          color: Colors.accent_blue,
        },
      },
      messageUser: {
        color: Colors.grey,
        fontSize: 12,
        fontWeight: '700',
        paddingRight: 6,
      },
      metaContainer: {
        flexDirection: 'row',
        marginTop: 4,
      },
      metaText: {
        color: Colors.grey,
        fontSize: 12,
      },
      textContainer: {
        onlyEmojiMarkdown: { text: { fontSize: 50 } },
      },
    },
    file: {
      container: {
        backgroundColor: Colors.white,
      },
      details: {},
      fileSize: {
        color: Colors.grey,
      },
      icon: {},
      title: {
        color: Colors.black,
      },
    },
    fileAttachmentGroup: {
      container: {},
    },
    gallery: {
      galleryContainer: {},
      galleryItemColumn: {},
      halfSize: 100,
      image: {},
      imageContainer: {},
      moreImagesContainer: {
        backgroundColor: Colors.overlay,
      },
      moreImagesText: {
        color: Colors.white,
      },
      size: 200,
      width: 250,
    },
    giphy: {
      cancel: {
        color: Colors.grey,
      },
      cancelContainer: {
        borderRightColor: Colors.border,
      },
      container: {},
      giphy: {},
      giphyContainer: {
        backgroundColor: Colors.grey,
      },
      giphyMask: {},
      giphyText: {
        color: Colors.white,
      },
      selectionContainer: {
        backgroundColor: Colors.white,
        borderColor: `${Colors.black}0D`, // 0D = 5% opacity
      },
      selector: {
        borderBottomColor: Colors.border,
      },
      send: {
        color: Colors.accent_blue,
      },
      sendContainer: {},
      shuffleButton: {
        borderColor: Colors.border,
      },
      title: {
        color: Colors.black,
      },
    },
    reactionList: {
      container: {},
      middleIcon: {},
      radius: 2, // not recommended to change this
      reactionBubble: {},
      reactionBubbleBackground: {},
      reactionSize: 24,
      strokeSize: 1, // not recommended to change this
    },
    replies: {
      container: {},
      messageRepliesText: {
        color: Colors.accent_blue,
      },
    },
    status: {
      checkAllIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        pathFill: Colors.accent_blue,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      checkIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      readByCount: {
        color: Colors.accent_blue,
      },
      statusContainer: {},
      timeIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
    },
  },
  overlay: {
    padding: 8,
    reactions: {
      avatarContainer: {},
      avatarName: {},
      avatarSize: 64,
      container: {
        backgroundColor: Colors.white,
      },
      flatListContainer: {},
      radius: 2,
      reactionBubble: {},
      reactionBubbleBackground: {},
      title: {
        color: Colors.black,
      },
    },
    reactionsList: {
      radius: 2.5,
      reaction: {},
      reactionList: {
        backgroundColor: Colors.white_snow,
      },
    },
  },
  reply: {
    container: {},
    fileAttachmentContainer: {},
    imageAttachment: {},
    markdownStyles: {},
    messageContainer: {
      borderColor: Colors.border,
    },
    textContainer: {},
  },
  screenPadding: 8,
  spinner: {},
  thread: {
    newThread: {
      backgroundGradientStart: Colors.bg_gradient_end,
      backgroundGradientStop: Colors.bg_gradient_start,
      text: {
        color: Colors.grey,
      },
    },
  },
  typingIndicator: {
    container: {
      backgroundColor: `${Colors.white_snow}E6`,
    },
    text: {
      color: Colors.grey,
      fontSize: 14,
    },
  },
};
