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
};

const Sizes = {
  borderRadius: 16,
  borderRadiusS: 2,
};

const defaultTheme = {
  colors: {
    ...Colors,
  },
  avatar: {
    container: {},
    image: {},
    text: {
      color: Colors.textLight,
      textTransform: 'uppercase',
      fontSize: BASE_FONT_SIZE - 2,
      fontWeight: '600',
    },
    fallback: {
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  attachment: {
    file: {
      container: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBEBEB',
        padding: 10,
        borderRadius: 16,
      },
      details: {
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 10,
      },
      title: {
        fontWeight: 700,
      },
      size: {},
    },
    actions: {
      container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 5,
      },
      button: {
        primaryBackgroundColor: Colors.primary,
        defaultBackgroundColor: 'white',
        primaryBorderColor: Colors.light,
        defaultBorderColor: 'transparent',
        borderWidth: 1,
        borderRadius: 20,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 10,
        paddingRight: 10,
        alignItems: 'center',
      },
      buttonText: {
        primaryColor: 'white',
        defaultColor: 'black',
      },
    },
  },
  card: {
    container: {
      overflow: 'hidden',
      backgroundColor: Colors.light,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      width: 250,
    },
    cover: {
      display: 'flex',
      height: 150,
    },
    footer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
    },
  },

  channelPreview: {
    messenger: {
      container: {
        display: 'flex',
        flexDirection: 'row',
        borderBottomColor: '#EBEBEB',
        borderBottomWidth: 1,
        padding: 10,
      },
      details: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        paddingLeft: 10,
      },
      detailsTop: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      },
      title: {
        fontWeight: 'bold',
        fontSize: 14,
        flex: 1,
      },
      date: {
        color: '#767676',
        fontSize: 11,
        textAlign: 'right',
      },
      message: {
        color: '#767676',
        unreadColor: '#000',
        fontSize: 13,
        fontWeight: 'normal',
        unreadFontWeight: 'bold',
      },
    },
  },

  closeButton: {
    container: {
      width: 30,
      height: 30,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
      border: '1px solid rgba(0, 0, 0, 0.1)',
    },
  },

  commandsItem: {
    container: {
      flexDirection: 'column',
      padding: 10,
    },

    top: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontWeight: 'bold',
    },
  },

  dateSeparator: {
    container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    line: {
      flex: 1,
      height: 0.5,
      backgroundColor: Colors.light,
    },
    date: {
      marginLeft: 5,
      marginRight: 5,
      textAlign: 'center',
      textTransform: 'uppercase',
      fontSize: 10,
      opacity: 0.8,
    },
    dateText: {},
  },

  gallery: {
    width: 240,
    size: 120,
    halfSize: 80,
    doubleSize: 240,
    flexWrap: 'wrap',
    flexDirection: 'row',

    single: {
      display: 'flex',
      maxWidth: 240,
      borderRadius: 16,
    },
    imageContainer: {
      display: 'flex',
    },
    doubleContainer: {
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      width: 240,
      height: 120,
      borderRadius: 16,
    },
    galleryContainer: {
      display: 'flex',
      flexDirection: 'row',
      borderRadius: 16,
      overflow: 'hidden',
    },
    header: {
      container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        position: 'absolute',
        width: '100%',
        zIndex: 1000,
      },
      button: {
        width: 30,
        height: 30,
        marginRight: 20,
        marginTop: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
      },
    },
  },

  hyperLink: {
    title: {
      color: Colors.primary,
      fontWeight: 'bold',
    },
  },

  iconBadge: {
    container: {},
    icon: {
      paddingTop: 5,
      alignSelf: 'center',
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconInner: {
      backgroundColor: 'green',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'flex-start',
      minWidth: 15,
      height: 15,
      paddingLeft: 3,
      paddingRight: 3,
      borderRadius: 20,
    },
    unreadCount: {
      fontSize: 10,
      color: '#fff',
    },
  },

  mentionsItem: {
    container: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      padding: 10,
      color: 'black',
      fontWeight: 'bold',
    },
  },

  messageSimple: {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 20,
      left: {
        justifyContent: 'flex-start',
      },
      right: {
        justifyContent: 'flex-end',
      },
    },
  },

  messageContent: {
    container: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 250,
      rightAlignItems: 'flex-end',
      leftAlignItems: 'flex-start',
      rightJustifyContent: 'flex-end',
      leftJustifyContent: 'flex-start',
      failedPadding: 5,
      failedBorderRadius: 10,
      failedBackgroundColor: Colors.danger,
      errorPadding: 5,
      errorBorderRadius: 10,
      errorBackgroundColor: Colors.danger,
    },
    containerInner: {
      alignItems: 'flex-end',
    },
    metaContainer: {
      marginTop: 2,
    },
    metaText: {
      fontSize: 11,
      color: Colors.textGrey,
      leftTextAlign: 'left',
      rightTextAlign: 'right',
    },
    deletedContainer: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 250,
      padding: 5,
      rightAlignItems: 'flex-end',
      leftAlignItems: 'flex-start',
      rightJustifyContent: 'flex-end',
      leftJustifyContent: 'flex-start',
    },
    deletedText: {
      fontSize: 15,
      lineHeight: 20,
      color: '#A4A4A4',
    },
  },

  messageStatus: {
    spacer: {
      height: 10,
      width: 20,
    },
    deliveredContainer: {
      display: 'flex',
      alignItems: 'center',
      width: 20,
      height: 20,
      paddingBottom: 10,
      paddingLeft: 5,
    },
    deliveredCircle: {
      width: 16,
      height: 16,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
    },
    checkMark: {
      width: 8,
      height: 6,
    },
    sendingContainer: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 5,
      paddingRight: 5,
    },
    sendingImage: {
      height: 10,
      width: 10,
    },
  },

  messageAvatar: {
    container: {
      margin: 8,
    },
    spacer: {
      width: 32,
      height: 28,
    },
  },

  messageReplies: {
    container: {
      padding: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    messageRepliesText: {
      fontWeight: 700,
      fontSize: 12,
    },
    image: {},
  },

  messageText: {
    borderBottomLeftRadius: Sizes.borderRadius,
    borderBottomRightRadius: Sizes.borderRadius,
    borderTopLeftRadius: Sizes.borderRadius,
    borderTopRightRadius: Sizes.borderRadius,
    borderRadiusS: Sizes.borderRadiusS,
    marginTop: 2,
    padding: 5,
    paddingLeft: 8,
    paddingRight: 8,
    failedBackgroundColor: 'transarent',
    errorBackggroundColor: 'transparent',
    transparent: 'transparent',
    filled: Colors.light,
    left: {
      alignSelf: 'flex-start',
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.08)',
    },
    right: {
      alignSelf: 'flex-end',
      borderWidth: 0,
      borderColor: 'transparent',
    },
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
