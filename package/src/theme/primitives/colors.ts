import { palette } from './palette';

type Pallete = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

type AccentColors = {
  primary: string;
  success: string;
  warning: string;
  error: string;
  neutral: string;
};

type StateColors = {
  hover: string;
  pressed: string;
  selected: string;
  bgOverlay: string;
  bgDisabled: string;
  textDisabled: string;
};

type TextColors = {
  primary: string;
  secondary: string;
  tertiary: string;
  inverse: string;
  onAccent: string;
  disabled: string;
  link: string;
};

type PresenceColors = {
  border: string;
  bgOnline: string;
  bgOffline: string;
};

type BorderCore = {
  surface: string;
  surfaceSubtle: string;
  surfaceStrong: string;
  onDark: string;
  onAccent: string;
  subtle: string;
  image: string;
};

export type BadgeColors = {
  border: string;
  bgInverse: string;
  bgPrimary: string;
  bgNeutral: string;
  bgError: string;
  text: string;
  textInverse: string;
};

export type RemoveControlColors = {
  bg: string;
  border: string;
  icon: string;
};

export type NewColors = {
  brand: Pallete;
  accent: AccentColors;
  state: StateColors;
  text: TextColors;
  presence: PresenceColors;
  border: BorderCore;
  badge: BadgeColors;
  control: RemoveControlColors;
};

export function resolveTheme(input: NewColors) {
  const brand = input.brand ?? palette.blue;
  const accent = input.accent ?? {
    primary: brand[500],
    success: palette.green[500],
    warning: palette.yellow[500],
    error: palette.red[500],
    neutral: palette.slate[500],
  };
  const text = input.text ?? {
    primary: brand[900],
    secondary: brand[700],
    tertiary: brand[500],
    inverse: palette.white,
    onAccent: palette.white,
    disabled: brand[400],
    link: accent.primary,
  };
  const state = input.state ?? {
    hover: palette.black5,
    pressed: palette.black10,
    selected: palette.black10,
    bgOverlay: palette.black50,
    bgDisabled: palette.slate[200],
    textDisabled: palette.slate[400],
  };
  const presence = input.presence ?? {
    border: palette.white,
    bgOnline: accent.success,
    bgOffline: accent.neutral,
  };
  const border = input.border ?? {
    surface: palette.slate[400],
    surfaceSubtle: palette.slate[200],
    surfaceStrong: palette.slate[600],
    onDark: palette.white,
    onAccent: palette.white,
    subtle: palette.slate[100],
    image: palette.black10,
  };
  const badge = input.badge ?? {
    border: palette.white,
    bgInverse: palette.white,
    bgPrimary: accent.primary,
    bgNeutral: accent.neutral,
    bgError: accent.error,
    text: palette.white,
    textInverse: palette.slate[900],
  };
  const control = input.control ?? {
    bg: palette.slate[900],
    border: border.onDark,
    icon: palette.white,
  };
  return {
    brand,
    accent,
    text,
    state,
    presence,
    border,
    badge,
    control,
  };
}

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
  border: {
    surface: palette.slate[400],
    surfaceSubtle: palette.slate[200],
    surfaceStrong: palette.slate[600],
    onDark: palette.white,
    onAccent: palette.white,
    subtle: palette.slate[100],
    image: palette.black10,
  },
  control: {
    bg: palette.slate[900],
    icon: palette.white,
    border: palette.white,
  },
  presence: {
    border: palette.white,
    bgOnline: palette.green[500],
    bgOffline: palette.slate[500],
  },
  badge: {
    border: palette.white,
    bgInverse: palette.white,
    bgPrimary: palette.blue[500],
    bgNeutral: palette.slate[500],
    bgError: palette.red[500],
    text: palette.white,
    textInverse: palette.slate[900],
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
    primary: palette.blue[400],
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
  border: {
    surface: palette.neutral[500],
    surfaceSubtle: palette.neutral[700],
    surfaceStrong: palette.neutral[400],
    onDark: palette.white,
    onAccent: palette.white,
    subtle: palette.neutral[800],
    image: palette.white20,
  },
  control: {
    bg: palette.neutral[800],
    icon: palette.white,
    border: palette.white,
  },
  presence: {
    border: palette.black,
  },
  badge: {
    border: palette.black,
    bgInverse: palette.white,
    bgPrimary: palette.blue[400],
    bgNeutral: palette.neutral[500],
    bgError: palette.red[400],
    text: palette.white,
    textInverse: palette.neutral[50],
  },
};
