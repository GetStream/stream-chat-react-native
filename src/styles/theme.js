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
      title: {
        fontWeight: 'bold',
        fontSize: 14,
        flex: 1,
      },
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
    flexWrap: 'wrap',
    flexDirection: 'row',

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
    container: {
      leftJustifyContent: 'flex-start',
      rightJustifyContent: 'flex-end',
    },
  },

  messageContent: {
    container: {
      rightAlignItems: 'flex-end',
      leftAlignItems: 'flex-start',
      rightJustifyContent: 'flex-end',
      leftJustifyContent: 'flex-start',
      // failedPadding: 5,
      // failedBorderRadius: 10,
      // failedBackgroundColor: Colors.danger,
      // errorPadding: 5,
      // errorBorderRadius: 10,
      // errorBackgroundColor: Colors.danger,
    },
    containerInner: {},
    metaContainer: {},
    metaText: {
      leftTextAlign: 'left',
      rightTextAlign: 'right',
    },
    deletedContainer: {
      rightAlignItems: 'flex-end',
      leftAlignItems: 'flex-start',
      rightJustifyContent: 'flex-end',
      leftJustifyContent: 'flex-start',
    },
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
    leftBorderWidth: 0.5,
    leftBorderColor: 'rgba(0,0,0,0.08)',
    rightBorderWidth: 0,
    rightBorderColor: 'transparent',
  },

  messageInput: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.05)',
      conditionalPadding: 20,
    },
    inputBox: {
      maxHeight: 60,
      marginTop: -5,
      flex: 1,
    },
    inputBoxContainer: {
      display: 'flex',
      flexDirection: 'row',
      paddingLeft: 10,
      paddingRight: 10,
      minHeight: 46,
      margin: 10,
      alignItems: 'center',
    },
    attachButton: {
      marginRight: 8,
    },
    attachButtonIcon: {
      height: 15,
      width: 15,
    },
    sendButton: {
      marginLeft: 8,
    },
    typing: {
      textAlign: 'right',
      height: 20,
    },
    imageUploadPreview: {
      container: {
        height: 70,
        display: 'flex',
        padding: 10,
      },
      itemContainer: {
        display: 'flex',
        height: 50,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginLeft: 5,
      },
      dismiss: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#fff',
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      },
      dismissImage: {
        width: 10,
        height: 10,
      },
      upload: {
        height: 50,
        width: 50,
        borderRadius: 10,
      },
    },
  },

  messageList: {
    listContainer: { flex: 1, paddingLeft: 10, paddingRight: 10 },
    newMessageNotification: {
      borderRadius: 10,
      backgroundColor: 'black',
      color: 'white',
      padding: 10,
    },
    newMessageNotificationText: {
      color: 'white',
    },
    notification: {
      warning: {
        color: 'red',
        backgroundColor: '#FAE6E8',
      },
    },
  },

  notification: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 10,
    marginBottom: 0,
    padding: 5,
    color: 'black',
    backgroundColor: 'transparent',
    warning: {
      color: 'red',
      backgroundColor: '#FAE6E8',
    },
  },

  messageNotification: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      zIndex: 10,
      marginBottom: 0,
    },
  },

  reactionList: {
    container: {
      opacity: 1,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      backgroundColor: 'black',
      borderRadius: 100,
    },
    reactionCount: {
      color: 'white',
      paddingLeft: 5,
      paddingRight: 5,
      fontSize: 12,
    },
  },

  reactionPicker: {
    container: {
      flex: 1,
      leftAlign: 'flex-start',
      rightAlign: 'flex-end',
    },
    containerView: {
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: 'black',
      paddingLeft: 20,
      height: 60,
      paddingRight: 20,
      borderRadius: 30,
    },
    column: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: -5,
    },
    emoji: {
      fontSize: 20,
      marginBottom: 5,
      marginTop: 5,
    },
    reactionCount: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
  },
  suggestionsProvider: {
    wrapper: {
      position: 'absolute',
      zIndex: 90,
      width: '100%',
    },
    container: {
      position: 'absolute',
      bottom: 10,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      maxHeight: 250,
      itemHeight: 50,
      backgroundColor: 'white',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: '0px -3px',
      zIndex: 100,
    },
  },
  suggestionsHeader: {
    title: {
      padding: 10,
      fontWeight: 'bold',
    },
  },
  suggestionsSeparator: {
    separator: {
      height: 0,
    },
  },
  suggestionsItem: {
    justifyContent: 'center',
  },
  thread: {
    newThread: {
      padding: 8,
      backgroundColor: '#F4F9FF',
      margin: 10,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      text: {},
    },
  },
  withProgressIndicator: {
    overlay: {
      position: 'absolute',
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    container: {
      position: 'absolute',
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0)',
    },
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
