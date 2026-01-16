import { TextStyle } from 'react-native';

export type FontWeightType = TextStyle['fontWeight'];

export type TypographyType = {
  fontWeight: Record<string, FontWeightType>;
  lineHeight: Record<string, number>;
  fontSize: Record<string, number>;
};

export const Typography: TypographyType = {
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 16,
    normal: 24,
    relaxed: 32,
  },
  fontSize: {
    micro: 8,
    xxs: 10,
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
  },
};
