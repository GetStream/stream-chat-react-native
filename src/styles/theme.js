import React from 'react';
import { ThemeProvider, ThemeConsumer } from '@stream-io/styled-components';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';

export const BASE_FONT_SIZE = 16;

export const Colors = {
  primary: '#006cff',
  secondary: '#111',
  danger: '#EDD8DD',
  light: '#EBEBEB',
  textLight: 'white',
  textDark: 'rgba(0,0,0,1)',
  textGrey: 'rgba(0,0,0,0.5)',
  transparent: 'transparent',
};

const defaultTheme = {
  colors: {
    ...Colors,
  },
  avatar: {
    container: {},
    image: {},
    text: {},
    fallback: {},
  },
  attachment: {
    file: {
      container: {},
      details: {},
      title: {},
      size: {},
    },
    actions: {
      container: {},
      button: {
        primaryBackgroundColor: Colors.primary,
        defaultBackgroundColor: 'white',
        primaryBorderColor: Colors.light,
        defaultBorderColor: 'transparent',
      },
      buttonText: {
        primaryColor: 'white',
        defaultColor: 'black',
      },
    },
  },
  card: {
    container: {},
    cover: {},
    footer: {},
  },

  channelPreview: {
    messenger: {
      container: {},
      details: {},
      detailsTop: {},
      title: {},
      date: {},
      message: {
        color: '#767676',
        unreadColor: '#000',
        fontWeight: 'normal',
        unreadFontWeight: 'bold',
      },
    },
  },

  closeButton: {
    container: {},
  },

  commandsItem: {
    container: {},
    top: {},
    title: {},
  },

  dateSeparator: {
    container: {},
    line: {},
    date: {},
    dateText: {},
  },

  gallery: {
    width: 240,
    size: 120,
    halfSize: 80,
    doubleSize: 240,

    single: {},
    imageContainer: {},
    galleryContainer: {},
    header: {
      container: {},
      button: {},
    },
  },

  hyperLink: {
    title: {},
  },

  iconBadge: {
    container: {},
    icon: {},
    iconInner: {},
    unreadCount: {},
  },

  mentionsItem: {
    container: {},
    name: {},
  },

  messageSimple: {
    container: {},
  },

  messageContent: {
    container: {},
    containerInner: {},
    metaContainer: {},
    metaText: {},
    deletedContainer: {},
    deletedText: {},
  },

  messageStatus: {
    spacer: {},
    deliveredContainer: {},
    deliveredCircle: {},
    checkMark: {},
    sendingContainer: {},
    sendingImage: {},
  },

  messageAvatar: {
    container: {},
    spacer: {},
  },

  messageReplies: {
    container: {},
    messageRepliesText: {},
    image: {},
  },

  messageText: {
    borderRadiusL: 16,
    borderRadiusS: 2,
    leftBorderWidth: 0.5,
    leftBorderColor: 'rgba(0,0,0,0.08)',
    rightBorderWidth: 0,
    rightBorderColor: 'transparent',
  },

  messageInput: {
    container: {
      conditionalPadding: 20,
    },
    inputBox: {},
    inputBoxContainer: {},
    attachButton: {},
    attachButtonIcon: {},
    sendButton: {},
    typing: {},
    imageUploadPreview: {
      container: {},
      itemContainer: {},
      dismiss: {},
      dismissImage: {},
      upload: {},
    },
  },

  messageList: {
    listContainer: {},
    newMessageNotification: {},
    newMessageNotificationText: {},
    errorNotification: {},
    errorNotificationText: {},
  },

  messageNotification: {
    container: {},
  },

  reactionList: {
    container: {},
    reactionCount: {},
  },

  reactionPicker: {
    container: {},
    containerView: {},
    column: {},
    emoji: {},
    reactionCount: {},
    text: {},
  },
  suggestionsProvider: {
    wrapper: {},
    container: {
      maxHeight: 250,
      itemHeight: 50,
    },
  },
  suggestionsHeader: {
    title: {},
  },
  suggestionsSeparator: {
    separator: {},
  },
  suggestionsItem: {},
  thread: {
    newThread: {
      text: {},
    },
  },
  withProgressIndicator: {
    overlay: {},
    container: {},
  },
};

const buildTheme = (t) => {
  const theme = merge({}, defaultTheme, t);
  return theme;
};

const themed = (WrappedComponent) => {
  if (!WrappedComponent.themePath) {
    throw Error('Only use themed on components that have a static themePath');
  }
  const ThemedComponent = ({ style, ...props }) => (
    <ThemeConsumer>
      {(themeProviderTheme) => {
        if (!style && themeProviderTheme) {
          return <WrappedComponent {...props} />;
        }
        themeProviderTheme = themeProviderTheme || defaultTheme;
        const modifiedTheme = style
          ? merge(
              {},
              themeProviderTheme,
              lodashSet({}, WrappedComponent.themePath, style),
            )
          : themeProviderTheme;
        return (
          <ThemeProvider theme={modifiedTheme}>
            <WrappedComponent {...props} />
          </ThemeProvider>
        );
      }}
    </ThemeConsumer>
  );
  ThemedComponent.themePath = WrappedComponent.themePath;
  ThemedComponent.displayName = `Themed${getDisplayName(WrappedComponent)}`;
  return ThemedComponent;
};

// Copied from here:
// https://reactjs.org/docs/higher-order-components.html#convention-wrap-the-display-name-for-easy-debugging
function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

const formatDefaultTheme = (component) => {
  const path = component.themePath;

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {`The path for this component in the full theme is "${path}" with the following styles:\n${JSON.stringify(
        lodashGet(defaultTheme, path),
        null,
        2,
      )}`}
    </div>
  );
};
export { themed, buildTheme, formatDefaultTheme };
