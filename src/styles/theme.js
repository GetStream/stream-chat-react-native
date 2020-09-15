import React from 'react';
import { ThemeConsumer, ThemeProvider } from '@stream-io/styled-components';
import lodashGet from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';

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

export const defaultTheme = {
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
  channelListHeaderNetworkDownIndicator: {
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
    container: {},
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
      // Available options for styling text: https://github.com/CharlesMangwa/react-native-simple-markdown/tree/next#styles-1
      markdown: {},
      metaContainer: {},
      metaText: {},
      textContainer: {
        borderRadiusL: 16,
        borderRadiusS: 2,
        leftBorderColor: 'rgba(0,0,0,0.08)',
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
      reactionCount: {},
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
      readByCount: {},
      sendingContainer: {},
      sendingImage: {},
      spacer: {},
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
      dismiss: {},
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
    eventIndicator: {
      date: {},
      memberUpdateContainer: {},
      memberUpdateText: {},
      memberUpdateTextContainer: {},
    },
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

export const themed = (OriginalComponent) => {
  if (OriginalComponent.themePath == null) {
    throw Error('Only use themed on components that have a static themePath');
  }
  const ThemedComponent = ({ style, ...props }) => (
    <ThemeConsumer>
      {(themeProviderTheme) => {
        if (!style && themeProviderTheme) {
          return <OriginalComponent {...props} />;
        }
        let modifiedTheme = themeProviderTheme || defaultTheme;
        if (style) {
          const themeDiff = {};
          const path = [];

          // replaces
          // { 'avatar.fallback': 'background-color: red;' }
          // with
          // { 'avatar.fallback': { css: 'background-color: red;' } }
          const replaceCssShorthand = (v) => {
            if (isPlainObject(v)) {
              const m = mapValues(v, (v, k) => {
                path.push(k);
                return replaceCssShorthand(v);
              });
              path.pop();
              return m;
            }
            if (isPlainObject(lodashGet(defaultTheme, path.join('.')))) {
              path.pop();
              return { css: v };
            }
            path.pop();
            return v;
          };

          style = replaceCssShorthand(style);
          for (const k in style) {
            if (
              lodashGet(defaultTheme, OriginalComponent.themePath + '.' + k)
            ) {
              merge(
                themeDiff,
                lodashSet({}, OriginalComponent.themePath + '.' + k, style[k]),
              );
            } else if (lodashGet(defaultTheme, k)) {
              merge(themeDiff, lodashSet({}, k, style[k]));
            } else {
              throw Error(`Unknown theme key ${k}`);
            }
          }

          modifiedTheme = merge({}, modifiedTheme, themeDiff);
        }
        return (
          <ThemeProvider theme={modifiedTheme}>
            <OriginalComponent {...props} />
          </ThemeProvider>
        );
      }}
    </ThemeConsumer>
  );
  ThemedComponent.themePath = OriginalComponent.themePath;
  ThemedComponent.extraThemePaths = OriginalComponent.extraThemePaths;
  ThemedComponent.displayName = `Themed${getDisplayName(OriginalComponent)}`;
  return ThemedComponent;
};

// Copied from here:
// https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export const originalCSS = {};

export function setOriginalCSS(path, string) {
  // remove junk at the start and end of the code snippet
  string = string
    .split('`')[1]
    .split('\n')
    .slice(1, -2)
    .join('\n');
  lodashSet(originalCSS, path + '.defaultCSS', string);
}
