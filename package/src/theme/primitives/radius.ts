import { Platform } from 'react-native';

export const Radius = {
  none: 0,
  xxs: Platform.select({
    android: 0,
    ios: 2,
    web: 2,
  }),
  xs: Platform.select({
    android: 2,
    ios: 4,
    web: 4,
  }),
  sm: Platform.select({
    android: 4,
    ios: 6,
    web: 6,
  }),
  md: Platform.select({
    android: 6,
    ios: 8,
    web: 8,
  }),
  lg: Platform.select({
    android: 8,
    ios: 12,
    web: 12,
  }),
  xl: Platform.select({
    android: 12,
    ios: 16,
    web: 16,
  }),
  xxl: Platform.select({
    android: 16,
    ios: 20,
    web: 20,
  }),
  xxxl: Platform.select({
    android: 20,
    ios: 24,
    web: 24,
  }),
  xxxxl: Platform.select({
    android: 24,
    ios: 32,
    web: 32,
  }),
  full: 9999,
};
