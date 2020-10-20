import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native';

export const BASE_FONT_SIZE = 16;

export const Colors = {
  danger: '#EDD8DD',
  light: '#EBEBEB',
  primary: '#006cff',
  secondary: '#111',
  textDark: 'rgba(0,0,0,1)',
  textGrey: 'rgba(0,0,0,0.5)',
  textLight: 'white',
  transparent: 'transparent',
};

export type MarkdownStyle = Partial<{
  blockQuoteBar: StyleProp<ViewStyle>;
  blockQuoteSection: StyleProp<ViewStyle>;
  blockQuoteSectionBar: StyleProp<ViewStyle>;
  blockQuoteText: StyleProp<ViewStyle>;
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
  link: StyleProp<TextStyle>;
  listItem: StyleProp<ViewStyle>;
  listItemBulletType: string;
  listItemButton: StyleProp<TextStyle>;
  listItemNumber: StyleProp<TextStyle>;
  listItemText: StyleProp<TextStyle>;
  mailTo: StyleProp<TextStyle>;
  paragraph: StyleProp<ViewStyle>;
  strong: StyleProp<TextStyle>;
  table: StyleProp<ViewStyle>;
  tableHeader: StyleProp<ViewStyle>;
  tableHeaderCell: StyleProp<ViewStyle>;
  tableRow: StyleProp<ViewStyle>;
  tableRowCell: StyleProp<ViewStyle>;
  tableRowLast: StyleProp<ViewStyle>;
  text: StyleProp<TextStyle>;
  u: StyleProp<TextStyle>;
  video: StyleProp<ImageStyle>;
  view: StyleProp<ViewStyle>;
}>;

export type Theme = {
  avatar: {
    container: ViewStyle;
    fallback: ViewStyle;
    image: ImageStyle;
    text: TextStyle;
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
  loadingErrorIndicator: {
    container: ViewStyle;
    errorText: TextStyle;
    retryText: TextStyle;
  };
  loadingIndicator: {
    container: ViewStyle;
    loadingText: TextStyle;
  };
  message: {
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
    actionSheet: {
      buttonContainer: ViewStyle;
      buttonText: TextStyle;
      cancelButtonContainer: ViewStyle;
      cancelButtonText: TextStyle;
      titleContainer: ViewStyle;
      titleText: TextStyle;
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
        link: TextStyle;
        logo: ImageStyle;
        title: TextStyle;
      };
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
      deletedText: TextStyle;
      errorContainer: {
        backgroundColor: ViewStyle['backgroundColor'];
      };
      /**
       * Available options for styling text:
       * https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1
       */
      markdown: MarkdownStyle;
      metaContainer: ViewStyle;
      metaText: TextStyle;
      textContainer: ViewStyle & {
        borderRadiusL: ViewStyle[
          | 'borderBottomLeftRadius'
          | 'borderTopLeftRadius'];
        borderRadiusS: ViewStyle[
          | 'borderBottomRightRadius'
          | 'borderTopRightRadius'];
        leftBorderColor: ViewStyle['borderLeftColor'];
        leftBorderWidth: ViewStyle['borderLeftWidth'];
        rightBorderColor: ViewStyle['borderRightColor'];
        rightBorderWidth: ViewStyle['borderRightWidth'];
      };
    };
    file: {
      container: ViewStyle;
      details: ViewStyle;
      icon: ImageStyle;
      size: TextStyle;
      title: TextStyle;
    };
    gallery: {
      doubleSize: ViewStyle['height'];
      galleryContainer: ViewStyle;
      halfSize: ViewStyle['height'];
      header: {
        button: ViewStyle;
        container: ViewStyle;
      };
      imageContainer: ViewStyle;
      single: ViewStyle;
      size: ViewStyle['height'];
      width: ViewStyle['width'];
    };
    reactionList: {
      container: ViewStyle;
      reactionCount: TextStyle;
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
      image: ImageStyle;
      messageRepliesText: TextStyle;
    };
    status: {
      checkMark: ImageStyle;
      deliveredCircle: ViewStyle;
      deliveredContainer: ViewStyle;
      readByContainer: ViewStyle;
      sendingContainer: ViewStyle;
      sendingImage: ImageStyle;
    };
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
    container: {},
    fallback: {},
    image: {},
    text: {},
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
      unreadColor: '#000',
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
  loadingErrorIndicator: {
    container: {},
    errorText: {},
    retryText: {},
  },
  loadingIndicator: {
    container: {},
    loadingText: {},
  },
  message: {
    actions: {
      button: {
        defaultBackgroundColor: 'white',
        defaultBorderColor: 'transparent',
        primaryBackgroundColor: Colors.primary,
        primaryBorderColor: Colors.light,
      },
      buttonText: {
        defaultColor: 'black',
        primaryColor: 'white',
      },
      container: {},
    },
    actionSheet: {
      buttonContainer: {},
      buttonText: {},
      cancelButtonContainer: {},
      cancelButtonText: {},
      titleContainer: {},
      titleText: {},
    },
    avatarWrapper: {
      container: {},
      spacer: {},
    },
    card: {
      container: {},
      cover: {},
      footer: {
        description: {},
        link: {},
        logo: {},
        title: {},
      },
    },
    container: {},
    content: {
      container: {
        borderRadiusL: 16,
        borderRadiusS: 2,
      },
      containerInner: {},
      deletedContainer: {},
      deletedText: {},
      errorContainer: {
        backgroundColor: Colors.danger,
      },
      markdown: {},
      metaContainer: {},
      metaText: {},
      textContainer: {
        borderRadiusL: 16,
        borderRadiusS: 2,
        leftBorderColor: 'rgba(0, 0, 0, 0.08)',
        leftBorderWidth: 0.5,
        rightBorderColor: 'transparent',
        rightBorderWidth: 0,
      },
    },
    file: {
      container: {},
      details: {},
      icon: {},
      size: {},
      title: {},
    },
    gallery: {
      doubleSize: 240,
      galleryContainer: {},
      halfSize: 80,
      header: {
        button: {},
        container: {},
      },
      imageContainer: {},
      single: {},
      size: 120,
      width: 240,
    },
    reactionList: {
      container: {},
      reactionCount: {},
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
      image: {},
      messageRepliesText: {},
    },
    status: {
      checkMark: {},
      deliveredCircle: {},
      deliveredContainer: {},
      readByContainer: {},
      sendingContainer: {},
      sendingImage: {},
    },
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
