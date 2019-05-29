import React from 'react';
import { ThemeProvider, ThemeConsumer } from '@stream-io/styled-components';
import merge from 'lodash/merge';
import lodashSet from 'lodash/set';
import lodashGet from 'lodash/get';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';

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

  channelPreview: {
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

  closeButton: {
    container: {},
  },

  iconBadge: {
    container: {},
    icon: {},
    iconInner: {},
    unreadCount: {},
  },

  message: {
    container: {},
    content: {
      container: {},
      containerInner: {},
      metaContainer: {},
      metaText: {},
      deletedContainer: {},
      deletedText: {},
    },
    status: {
      spacer: {},
      deliveredContainer: {},
      deliveredCircle: {},
      checkMark: {},
      sendingContainer: {},
      sendingImage: {},
    },
    avatarWrapper: {
      container: {},
      spacer: {},
    },
    replies: {
      container: {},
      messageRepliesText: {},
      image: {},
    },
    text: {
      borderRadiusL: 16,
      borderRadiusS: 2,
      leftBorderWidth: 0.5,
      leftBorderColor: 'rgba(0,0,0,0.08)',
      rightBorderWidth: 0,
      rightBorderColor: 'transparent',
    },
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
    card: {
      container: {},
      cover: {},
      footer: {},
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
    uploadProgressIndicator: {
      overlay: {},
      container: {},
    },

    suggestions: {
      wrapper: {},
      container: {
        maxHeight: 250,
        itemHeight: 50,
      },
      header: {
        title: {},
      },
      separator: {},
      item: {},
      mention: {
        container: {},
        name: {},
      },
      command: {
        container: {},
        top: {},
        title: {},
      },
    },
  },

  messageList: {
    listContainer: {},
    messageNotification: {},
    messageNotificationText: {},
    errorNotification: {},
    errorNotificationText: {},
    dateSeparator: {
      container: {},
      line: {},
      date: {},
      dateText: {},
    },
  },

  thread: {
    newThread: {
      text: {},
    },
  },
};

const buildTheme = (t) => {
  const theme = merge({}, defaultTheme, t);
  return theme;
};

const themed = (OriginalComponent) => {
  if (!OriginalComponent.themePath) {
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
              return { css: v };
            }
            return v;
          };

          style = replaceCssShorthand(style);
          for (const k in style) {
            if (
              lodashGet(defaultTheme, OriginalComponent.themePath + '.' + k)
            ) {
              lodashSet(
                themeDiff,
                OriginalComponent.themePath + '.' + k,
                style[k],
              );
            } else if (lodashGet(defaultTheme, k)) {
              lodashSet(themeDiff, k, style[k]);
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

const formatDefaultTheme = (component) => {
  const path = component.themePath;
  const extraThemePaths = component.extraThemePaths || [];
  const themes = merge({}, lodashGet(defaultTheme, path));
  for (let i = 0; i < extraThemePaths.length; i++) {
    merge(
      themes,
      lodashSet(
        {},
        extraThemePaths[i],
        lodashGet(defaultTheme, extraThemePaths[i]),
      ),
    );
  }

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {`The path for this component in the full theme is "${path}" with the following styles:\n${JSON.stringify(
        themes,
        null,
        2,
      )}`}
    </div>
  );
};
export { themed, buildTheme, formatDefaultTheme };
