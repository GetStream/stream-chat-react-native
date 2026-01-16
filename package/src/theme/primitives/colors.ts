import { palette } from './palette';

export type NewColors = typeof lightColors;

export const lightColors = {
  brand: palette.blue,
  accent: {
    primary: palette.blue[500],
    success: palette.green[500],
    warning: palette.yellow[500],
    error: palette.red[500],
    neutral: palette.slate[500],
  },
  state: {
    hover: palette.black5,
    pressed: palette.black10,
    selected: palette.black10,
    bgOverlay: palette.black50,
    bgDisabled: palette.slate[200],
    textDisabled: palette.slate[400],
  },
  text: {
    primary: palette.slate[900],
    secondary: palette.slate[700],
    tertiary: palette.slate[500],
    inverse: palette.white,
    onAccent: palette.white,
    disabled: palette.slate[400],
    link: palette.blue[500],
  },
  borderImage: palette.black10,
  borderSurfaceSubtle: palette.slate[200],
  control: {
    remove: palette.slate[900],
    icon: palette.white,
    border: palette.white,
  },
  presence: {
    border: palette.white,
  },
};

export const darkColors = {
  brand: {
    50: palette.blue[900],
    100: palette.blue[800],
    200: palette.blue[700],
    300: palette.blue[600],
    400: palette.blue[500],
    500: palette.blue[400],
    600: palette.blue[300],
    700: palette.blue[200],
    800: palette.blue[100],
    900: palette.blue[50],
    950: palette.white,
  },
  accent: {
    primary: palette.blue[500],
    success: palette.green[400],
    warning: palette.yellow[400],
    error: palette.red[400],
    neutral: palette.neutral[500],
  },
  state: {
    hover: palette.black5,
    pressed: palette.black10,
    selected: palette.black10,
    bgOverlay: palette.black50,
    bgDisabled: palette.neutral[800],
    textDisabled: palette.neutral[600],
  },
  text: {
    primary: palette.neutral[50],
    secondary: palette.neutral[300],
    tertiary: palette.neutral[400],
    inverse: palette.black,
    onAccent: palette.white,
    disabled: palette.neutral[600],
    link: palette.blue[500],
  },
  borderImage: palette.white20,
  borderSurfaceSubtle: palette.neutral[700],
  control: {
    remove: palette.neutral[800],
    icon: palette.white,
    border: palette.white,
  },
  presence: {
    border: palette.black,
  },
};
