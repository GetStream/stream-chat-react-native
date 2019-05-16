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

  dateSeparator: {
    container: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    line: {
      flex: 1,
      borderColor: Colors.light,
      borderWidth: 1,
      height: 0,
    },
    date: {
      flex: 1,
      textAlign: 'center',
    },
  },
};

const buildTheme = (t) => {
  const theme = merge(defaultTheme, t);
  return theme;
};

export { buildTheme };
