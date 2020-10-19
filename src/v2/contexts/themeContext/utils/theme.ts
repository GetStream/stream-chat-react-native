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
    container: StyleProp<ViewStyle>;
    fallback: StyleProp<ViewStyle>;
    image: StyleProp<ImageStyle>;
    text: StyleProp<TextStyle>;
  };
  channelListFooterLoadingIndicator: {
    container: StyleProp<ViewStyle>;
  };
  channelListHeaderErrorIndicator: {
    container: StyleProp<ViewStyle>;
    errorText: StyleProp<TextStyle>;
  };
  channelPreview: {
    container: StyleProp<ViewStyle>;
    date: StyleProp<TextStyle>;
    details: StyleProp<ViewStyle>;
    detailsTop: StyleProp<ViewStyle>;
    message: StyleProp<TextStyle> & {
      color: string;
      fontWeight: string;
      unreadColor: string;
      unreadFontWeight: string;
    };
    title: StyleProp<TextStyle>;
  };
  closeButton: {
    container: StyleProp<ViewStyle>;
  };
  colors: typeof Colors;
  iconBadge: {
    icon: StyleProp<ViewStyle>;
    iconInner: StyleProp<ViewStyle>;
    unreadCount: StyleProp<TextStyle>;
  };
  iconSquare: {
    container: StyleProp<ViewStyle>;
  };
  loadingErrorIndicator: {
    container: StyleProp<ViewStyle>;
    errorText: StyleProp<TextStyle>;
    retryText: StyleProp<TextStyle>;
  };
  loadingIndicator: {
    container: StyleProp<ViewStyle>;
    loadingText: StyleProp<TextStyle>;
  };
  message: {
    actions: {
      button: StyleProp<ViewStyle> & {
        defaultBackgroundColor: string;
        defaultBorderColor: string;
        primaryBackgroundColor: string;
        primaryBorderColor: string;
      };
      buttonText: StyleProp<TextStyle> & {
        defaultColor: string;
        primaryColor: string;
      };
      container: StyleProp<ViewStyle>;
    };
    actionSheet: {
      buttonContainer: StyleProp<ViewStyle>;
      buttonText: StyleProp<TextStyle>;
      cancelButtonContainer: StyleProp<ViewStyle>;
      cancelButtonText: StyleProp<TextStyle>;
      titleContainer: StyleProp<ViewStyle>;
      titleText: StyleProp<TextStyle>;
    };
    avatarWrapper: {
      container: StyleProp<ViewStyle>;
      spacer: StyleProp<ViewStyle>;
    };
    card: {
      container: StyleProp<ViewStyle>;
      cover: StyleProp<ImageStyle>;
      footer: StyleProp<ViewStyle> & {
        description: StyleProp<TextStyle>;
        link: StyleProp<TextStyle>;
        logo: StyleProp<ImageStyle>;
        title: StyleProp<TextStyle>;
      };
    };
    container: StyleProp<ViewStyle>;
    content: {
      container: StyleProp<ViewStyle> & {
        borderRadiusL: number;
        borderRadiusS: number;
      };
      containerInner: StyleProp<ViewStyle>;
      deletedContainer: StyleProp<ViewStyle>;
      deletedText: StyleProp<TextStyle>;
      errorContainer: {
        backgroundColor: string;
      };
      /**
       * Available options for styling text:
       * https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1
       */
      markdown: MarkdownStyle;
      metaContainer: StyleProp<ViewStyle>;
      metaText: StyleProp<TextStyle>;
      textContainer: StyleProp<ViewStyle> & {
        borderRadiusL: number;
        borderRadiusS: number;
        leftBorderColor: string;
        leftBorderWidth: number;
        rightBorderColor: string;
        rightBorderWidth: number;
      };
    };
    file: {
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      icon: StyleProp<ImageStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    };
    gallery: {
      doubleSize: number;
      galleryContainer: StyleProp<ViewStyle>;
      halfSize: number;
      header: {
        button: StyleProp<ViewStyle>;
        container: StyleProp<ViewStyle>;
      };
      imageContainer: StyleProp<ViewStyle>;
      single: StyleProp<ViewStyle>;
      size: number;
      width: number;
    };
    reactionList: {
      container: StyleProp<ViewStyle>;
      reactionCount: StyleProp<TextStyle>;
    };
    reactionPicker: {
      column: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
      containerView: StyleProp<ViewStyle>;
      emoji: StyleProp<TextStyle>;
      text: StyleProp<TextStyle>;
    };
    replies: {
      container: StyleProp<ViewStyle>;
      image: StyleProp<ImageStyle>;
      messageRepliesText: StyleProp<TextStyle>;
    };
    status: {
      checkMark: StyleProp<ImageStyle>;
      deliveredCircle: StyleProp<ViewStyle>;
      deliveredContainer: StyleProp<ViewStyle>;
      readByContainer: StyleProp<ViewStyle>;
      sendingContainer: StyleProp<ViewStyle>;
      sendingImage: StyleProp<ImageStyle>;
    };
  };
  messageInput: {
    actionSheet: {
      buttonContainer: StyleProp<ViewStyle>;
      buttonText: StyleProp<ImageStyle>;
      titleContainer: StyleProp<ViewStyle>;
      titleText: StyleProp<ImageStyle>;
    };
    attachButton: StyleProp<ViewStyle>;
    attachButtonIcon: StyleProp<ImageStyle>;
    container: StyleProp<ViewStyle> & {
      conditionalPadding: number;
    };
    editingBoxContainer: StyleProp<ViewStyle>;
    editingBoxHeader: StyleProp<ViewStyle>;
    editingBoxHeaderTitle: StyleProp<ImageStyle>;
    fileUploadPreview: {
      attachmentContainerView: StyleProp<ViewStyle>;
      attachmentView: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
      dismiss: StyleProp<ViewStyle>;
      dismissImage: StyleProp<ImageStyle>;
      filenameText: StyleProp<TextStyle>;
    };
    imageUploadPreview: {
      container: StyleProp<ViewStyle>;
      dismiss: StyleProp<ViewStyle>;
      dismissImage: StyleProp<ImageStyle>;
      itemContainer: StyleProp<ViewStyle>;
      upload: StyleProp<ImageStyle>;
    };
    inputBox: StyleProp<TextStyle>;
    inputBoxContainer: StyleProp<ViewStyle>;
    sendButton: StyleProp<ViewStyle>;
    sendButtonIcon: StyleProp<ImageStyle>;
    suggestions: {
      command: {
        args: StyleProp<TextStyle>;
        container: StyleProp<ViewStyle>;
        description: StyleProp<TextStyle>;
        title: StyleProp<TextStyle>;
        top: StyleProp<ViewStyle>;
      };
      container: StyleProp<ViewStyle> & {
        itemHeight: number;
        maxHeight: number;
      };
      item: StyleProp<ViewStyle>;
      mention: {
        container: StyleProp<ViewStyle>;
        name: StyleProp<TextStyle>;
      };
      separator: StyleProp<ViewStyle>;
      title: StyleProp<TextStyle>;
      wrapper: StyleProp<ViewStyle>;
    };
    uploadProgressIndicator: {
      container: StyleProp<ViewStyle>;
      overlay: StyleProp<ViewStyle>;
    };
  };
  messageList: {
    dateSeparator: {
      container: StyleProp<ViewStyle>;
      date: StyleProp<TextStyle>;
      dateText: StyleProp<TextStyle>;
      line: StyleProp<ViewStyle>;
    };
    errorNotification: StyleProp<ViewStyle>;
    errorNotificationText: StyleProp<TextStyle>;
    listContainer: StyleProp<ViewStyle>;
    messageNotification: {
      container: StyleProp<ViewStyle>;
      text: StyleProp<TextStyle>;
    };
    messageSystem: {
      container: StyleProp<ViewStyle>;
      dateText: StyleProp<TextStyle>;
      line: StyleProp<ViewStyle>;
      text: StyleProp<TextStyle>;
      textContainer: StyleProp<ViewStyle>;
    };
    typingIndicatorContainer: StyleProp<ViewStyle>;
  };
  spinner: StyleProp<ViewStyle>;
  thread: {
    newThread: StyleProp<ViewStyle> & {
      text: StyleProp<TextStyle>;
    };
  };
  typingIndicator: {
    container: StyleProp<ViewStyle>;
    text: StyleProp<TextStyle> & {
      color: string;
      fontSize: number;
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
