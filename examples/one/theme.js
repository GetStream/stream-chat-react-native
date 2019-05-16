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

const theme = {
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
};

export { theme };

// TODO: some kind of merging of user theme with our theme like we do with buildStylesheet();
