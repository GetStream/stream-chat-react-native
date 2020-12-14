import { vh } from '../../../utils/utils';

import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { CircleProps, StopProps } from 'react-native-svg';

import type { IconProps } from '../../../icons/utils/base';

export const DEFAULT_STATUS_ICON_SIZE = 16;

export const Colors = {
  attachmentBackground: '#E9F2FF',
  background: '#FCFCFC',
  background2: '#F5F5F5',
  black: '#000000',
  danger: '#FF3742',
  green: '#20E070',
  grey: '#E5E5E5',
  light: '#EBEBEB',
  primary: '#006CFF',
  secondary: '#111111',
  textDark: '#000000',
  textGrey: '#00000080',
  textLight: '#00000014', // 14 = 8% opacity
  transparent: 'transparent',
  white: '#FFFFFF',
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
  closeButton: {
    container: ViewStyle;
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
    footer: {
      centerContainer?: ViewStyle;
      container?: ViewStyle;
      imageCountText?: TextStyle;
      innerContainer?: ViewStyle;
      leftContainer?: ViewStyle;
      rightContainer?: ViewStyle;
    };
    header: {
      centerContainer?: ViewStyle;
      container?: ViewStyle;
      dateText?: TextStyle;
      innerContainer?: ViewStyle;
      leftContainer?: ViewStyle;
      rightContainer?: ViewStyle;
      usernameText?: TextStyle;
    };
    backgroundColor?: string;
    blurType?: 'light' | 'dark';
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
    autoCompleteInputContainer: ViewStyle;
    commandsButton: ViewStyle;
    commandsButtonContainer: ViewStyle;
    composerContainer: ViewStyle;
    container: ViewStyle;
    editingBoxContainer: ViewStyle;
    editingBoxHeader: ViewStyle;
    editingBoxHeaderTitle: ImageStyle;
    fileUploadPreview: {
      dismiss: ViewStyle;
      fileContainer: ViewStyle;
      fileContentContainer: ViewStyle;
      filenameText: TextStyle;
      fileSizeText: TextStyle;
      fileTextContainer: ViewStyle;
      flatList: ViewStyle;
    };
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
    errorNotification: ViewStyle;
    errorNotificationText: TextStyle;
    listContainer: ViewStyle;
    messageNotification: {
      container: ViewStyle;
      text: TextStyle;
    };
    messageSystem: {
      container: ViewStyle;
      dateText: TextStyle;
      line: ViewStyle;
      text: TextStyle;
      textContainer: ViewStyle;
    };
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
    reactionPicker: {
      column: ViewStyle;
      container: ViewStyle;
      containerView: ViewStyle;
      emoji: TextStyle;
      text: TextStyle;
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
    bottomSheetContentContainer: {},
    errorButtonText: {},
    errorContainer: {},
    errorText: {},
    image: {},
    imageOverlay: {},
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
      fill: Colors.green,
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
    channelName: {},
    channelStatus: {
      color: Colors.textGrey,
    },
    container: {},
    containerInner: {
      backgroundColor: Colors.white,
    },
    deleteRow: {
      borderBottomColor: Colors.textLight,
      borderBottomWidth: 1,
    },
    deleteText: { color: Colors.danger },
    detailsContainer: {},
    flatList: {},
    flatListContent: {},
    leaveGroupRow: {},
    leaveGroupText: {},
    row: {
      borderTopColor: Colors.textLight,
    },
    rowInner: {},
    userItemContainer: {},
    userName: {},
  },
  channelListFooterLoadingIndicator: {
    container: {},
  },
  channelListHeaderErrorIndicator: {
    container: {},
    errorText: {
      color: Colors.white,
    },
  },
  channelListMessenger: {
    flatList: {
      backgroundColor: Colors.background,
    },
    flatListContent: {},
    header: {},
    searchContainer: {
      backgroundColor: Colors.white,
      borderColor: Colors.textLight,
    },
    searchInput: {},
  },
  channelListSkeleton: {
    animationTime: 1000, // in milliseconds
    background: {
      backgroundColor: Colors.background,
    },
    container: {
      borderBottomColor: Colors.light,
    },
    gradientStart: {},
    gradientStop: {},
    height: 64,
  },
  channelPreview: {
    checkAllIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      pathFill: Colors.primary,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    checkIcon: {
      height: DEFAULT_STATUS_ICON_SIZE,
      width: DEFAULT_STATUS_ICON_SIZE,
    },
    container: {
      backgroundColor: Colors.background,
      borderBottomColor: Colors.light,
    },
    contentContainer: {},
    date: {
      color: Colors.textGrey,
    },
    leftSwipeableButton: {},
    message: {
      color: Colors.textGrey,
      fontWeight: '400',
    },
    rightSwipeableButton: {},
    row: {},
    swipeableContainer: {
      backgroundColor: Colors.background2,
    },
    title: {},
    unreadContainer: {
      backgroundColor: Colors.danger,
    },
    unreadText: {
      color: Colors.white,
    },
  },
  closeButton: {
    container: {},
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
    footer: {},
    header: {},
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
    autoCompleteInputContainer: {},
    commandsButton: {},
    commandsButtonContainer: {},
    composerContainer: {},
    container: {},
    editingBoxContainer: {},
    editingBoxHeader: {},
    editingBoxHeaderTitle: {},
    fileUploadPreview: {
      dismiss: {},
      fileContainer: {},
      fileContentContainer: {},
      filenameText: {},
      fileSizeText: {
        color: Colors.textGrey,
      },
      fileTextContainer: {},
      flatList: {},
    },
    imageUploadPreview: {
      dismiss: {
        backgroundColor: Colors.textGrey,
      },
      flatList: {},
      itemContainer: {},
      upload: {},
    },
    inputBox: {},
    inputBoxContainer: {},
    moreOptionsButton: {},
    optionsContainer: {},
    replyContainer: {},
    sendButton: {},
    sendButtonContainer: {},
    suggestions: {
      command: {
        args: {
          color: Colors.textGrey,
        },
        container: {},
        iconContainer: {
          backgroundColor: Colors.primary,
        },
        title: {},
      },
      commandsHeader: {
        container: {},
        title: {
          color: Colors.textGrey,
        },
      },
      container: {
        maxHeight: vh(25),
      },
      emoji: {
        container: {},
        text: {},
      },
      emojisHeader: {
        container: {},
        title: {
          color: Colors.textGrey,
        },
      },
      item: {},
      mention: {
        avatarSize: 40,
        column: {},
        container: {},
        name: {},
        tag: {
          color: Colors.textGrey,
        },
      },
      title: {},
    },
    suggestionsListContainer: {
      backgroundColor: Colors.white,
    },
    uploadProgressIndicator: {
      container: {},
      overlay: {},
    },
  },
  messageList: {
    errorNotification: {},
    errorNotificationText: {},
    listContainer: {},
    messageNotification: {
      container: {},
      text: {},
    },
    messageSystem: {
      container: {},
      dateText: {},
      line: {},
      text: {},
      textContainer: {},
    },
    typingIndicatorContainer: {},
  },
  messageSimple: {
    actions: {
      button: {
        defaultBackgroundColor: Colors.white,
        defaultBorderColor: Colors.transparent,
        primaryBackgroundColor: Colors.primary,
        primaryBorderColor: Colors.light,
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
      authorName: { color: Colors.primary },
      authorNameContainer: { backgroundColor: Colors.attachmentBackground },
      authorNameFooter: { color: Colors.primary },
      authorNameFooterContainer: { backgroundColor: Colors.transparent },
      authorNameMask: {},
      container: {},
      cover: {},
      footer: {
        description: {
          color: Colors.textDark,
        },
        title: {
          color: Colors.textDark,
          fontWeight: '700',
        },
      },
      noURI: {
        borderLeftColor: Colors.primary,
        borderLeftWidth: 2,
        paddingLeft: 8,
      },
    },
    container: {},
    content: {
      container: {
        borderRadiusL: 16,
        borderRadiusS: 2,
      },
      containerInner: {
        borderColor: Colors.grey,
      },
      deletedContainer: {},
      deletedMetaText: {
        paddingHorizontal: 10,
      },
      deletedText: {
        em: {
          color: Colors.textGrey,
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
        pathFill: Colors.danger,
        width: 20,
      },
      errorIconContainer: {
        bottom: -2,
        position: 'absolute',
        right: -12,
      },
      eyeIcon: {
        height: 16,
        pathFill: Colors.textGrey,
        width: 16,
      },
      markdown: {
        autolink: {
          color: Colors.primary,
          textDecorationLine: 'underline',
        },
        mentions: {
          color: Colors.primary,
        },
      },
      messageUser: { fontSize: 12, fontWeight: '700', paddingRight: 6 },
      metaContainer: {
        flexDirection: 'row',
        marginTop: 4,
      },
      metaText: {
        color: Colors.textGrey,
        fontSize: 12,
      },
      textContainer: {
        onlyEmojiMarkdown: { text: { fontSize: 50 } },
      },
    },
    file: {
      container: {},
      details: {},
      fileSize: {
        color: Colors.textGrey,
      },
      icon: {},
      title: {},
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
        backgroundColor: `${Colors.black}4D`, // 4D = 30% opacity
      },
      moreImagesText: {
        color: Colors.white,
      },
      size: 200,
      width: 250,
    },
    giphy: {
      cancel: {
        color: Colors.textGrey,
      },
      cancelContainer: {
        borderRightColor: Colors.light,
      },
      container: {},
      giphy: {},
      giphyContainer: {
        backgroundColor: Colors.textGrey,
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
        borderBottomColor: Colors.light,
      },
      send: {
        color: Colors.primary,
      },
      sendContainer: {},
      shuffleButton: {
        borderColor: Colors.light,
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
    reactionPicker: {
      column: {},
      container: {},
      containerView: {},
      emoji: {},
      text: {},
    },
    replies: {
      container: {},
      messageRepliesText: {
        color: Colors.primary,
      },
    },
    status: {
      checkAllIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        pathFill: Colors.primary,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      checkIcon: {
        height: DEFAULT_STATUS_ICON_SIZE,
        width: DEFAULT_STATUS_ICON_SIZE,
      },
      readByCount: {
        color: Colors.primary,
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
      container: {},
      flatListContainer: {},
      radius: 2,
      reactionBubble: {},
      reactionBubbleBackground: {},
      title: {},
    },
    reactionsList: {
      radius: 2.5,
      reaction: {},
      reactionList: {
        backgroundColor: Colors.background,
      },
    },
  },
  reply: {
    container: {},
    fileAttachmentContainer: {},
    imageAttachment: {},
    markdownStyles: {},
    messageContainer: {
      borderColor: Colors.textLight,
    },
    textContainer: {},
  },
  screenPadding: 8,
  spinner: {},
  thread: {
    newThread: {
      text: {},
    },
  },
  typingIndicator: {
    container: {},
    text: {
      color: Colors.textGrey,
      fontSize: 14,
    },
  },
};
