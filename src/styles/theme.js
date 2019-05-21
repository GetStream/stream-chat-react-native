const merge = require('deepmerge');

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

const defaultTheme = {
  colors: {
    ...Colors,
  },
  avatarImage: {
    size: 32,
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
  avatarFallback: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textLight,
    textTransform: 'uppercase',
    fontSize: BASE_FONT_SIZE - 2,
    fontWeight: '600',
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

  messageInput: {
    inputBox: {
      maxHeight: 60,
      marginTop: -5,
      flex: 1,
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
    messageRepliesImage: {},
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
};

const buildTheme = (t) => {
  const theme = merge(defaultTheme, t);
  return theme;
};

export { buildTheme };
