import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { IconProps } from '../../../icons/utils/base';

export const BASE_FONT_SIZE = 16;
export const DEFAULT_STATUS_ICON_SIZE = 16;

export const Colors = {
  attachmentBackground: '#E9F2FF',
  black: '#000000',
  danger: '#FF3742',
  grey: '#E6E6E6',
  light: '#EBEBEB',
  primary: '#006CFF',
  secondary: '#111111',
  textDark: '#000000',
  textGrey: '#00000080',
  textLight: '#FFFFFF',
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
  avatar: {
    BASE_AVATAR_FALLBACK_TEXT_SIZE: number;
    BASE_AVATAR_SIZE: number;
    container: ViewStyle;
    fallback: ViewStyle;
    image: ImageStyle;
    text: TextStyle;
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
  channelPreview: {
    container: ViewStyle;
    date: TextStyle;
    details: ViewStyle;
    detailsTop: ViewStyle;
    message: TextStyle & {
      color: TextStyle['color'];
      fontWeight: TextStyle['fontWeight'];
      unreadColor: TextStyle['color'];
      unreadFontWeight: TextStyle['fontWeight'];
    };
    title: TextStyle;
  };
  closeButton: {
    container: ViewStyle;
  };
  colors: typeof Colors;
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
    actionSheet: {
      buttonContainer: ViewStyle;
      buttonText: ImageStyle;
      titleContainer: ViewStyle;
      titleText: ImageStyle;
    };
    attachButton: ViewStyle;
    attachButtonIcon: ImageStyle;
    container: ViewStyle & {
      conditionalPadding: ViewStyle['paddingTop'];
    };
    editingBoxContainer: ViewStyle;
    editingBoxHeader: ViewStyle;
    editingBoxHeaderTitle: ImageStyle;
    fileUploadPreview: {
      attachmentContainerView: ViewStyle;
      attachmentView: ViewStyle;
      container: ViewStyle;
      dismiss: ViewStyle;
      dismissImage: ImageStyle;
      filenameText: TextStyle;
    };
    imageUploadPreview: {
      container: ViewStyle;
      dismiss: ViewStyle;
      dismissImage: ImageStyle;
      itemContainer: ViewStyle;
      upload: ImageStyle;
    };
    inputBox: TextStyle;
    inputBoxContainer: ViewStyle;
    sendButton: ViewStyle;
    sendButtonIcon: ImageStyle;
    suggestions: {
      command: {
        args: TextStyle;
        container: ViewStyle;
        description: TextStyle;
        title: TextStyle;
        top: ViewStyle;
      };
      container: ViewStyle & {
        itemHeight: number;
        maxHeight: number;
      };
      item: ViewStyle;
      mention: {
        container: ViewStyle;
        name: TextStyle;
      };
      separator: ViewStyle;
      title: TextStyle;
      wrapper: ViewStyle;
    };
    uploadProgressIndicator: {
      container: ViewStyle;
      overlay: ViewStyle;
    };
  };
  messageList: {
    dateSeparator: {
      container: ViewStyle;
      date: TextStyle;
      dateText: TextStyle;
      line: ViewStyle;
    };
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
  avatar: {
    BASE_AVATAR_FALLBACK_TEXT_SIZE: 14,
    BASE_AVATAR_SIZE: 32,
    container: {},
    fallback: {
      backgroundColor: Colors.primary,
      borderRadius: 16,
      height: 16,
      width: 16,
    },
    image: {
      borderRadius: 16,
      height: 32,
      width: 32,
    },
    text: {
      color: Colors.textLight,
      fontSize: 14,
    },
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
  channelPreview: {
    container: {},
    date: {},
    details: {},
    detailsTop: {},
    message: {
      color: '#767676',
      fontWeight: 'normal',
      unreadColor: Colors.black,
      unreadFontWeight: 'bold',
    },
    title: {},
  },
  closeButton: {
    container: {},
  },
  colors: {
    ...Colors,
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
    actionSheet: {
      buttonContainer: {},
      buttonText: {},
      titleContainer: {},
      titleText: {},
    },
    attachButton: {},
    attachButtonIcon: {},
    container: {
      conditionalPadding: 20,
    },
    editingBoxContainer: {},
    editingBoxHeader: {},
    editingBoxHeaderTitle: {},
    fileUploadPreview: {
      attachmentContainerView: {},
      attachmentView: {},
      container: {},
      dismiss: {},
      dismissImage: {},
      filenameText: {},
    },
    imageUploadPreview: {
      container: {},
      dismiss: {},
      dismissImage: {},
      itemContainer: {},
      upload: {},
    },
    inputBox: {},
    inputBoxContainer: {},
    sendButton: {},
    sendButtonIcon: {},
    suggestions: {
      command: {
        args: {},
        container: {},
        description: {},
        title: {},
        top: {},
      },
      container: {
        itemHeight: 50,
        maxHeight: 250,
      },
      item: {},
      mention: {
        container: {},
        name: {},
      },
      separator: {},
      title: {},
      wrapper: {},
    },
    uploadProgressIndicator: {
      container: {},
      overlay: {},
    },
  },
  messageList: {
    dateSeparator: {
      container: {},
      date: {},
      dateText: {},
      line: {},
    },
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
      markdown: {},
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
        backgroundColor: Colors.grey,
      },
    },
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
