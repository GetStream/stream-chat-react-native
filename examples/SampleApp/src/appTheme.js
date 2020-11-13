/* eslint-disable sort-keys */
// src/appTheme.js
import { DefaultTheme } from '@react-navigation/native';

export const DarkTheme = {
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#070A0D',
    backgroundSecondary: '#212527',
    backgroundNavigation: '#0B0E14',
    footnote: '#2F3134',
    greyContentBackground: '#23272B',
    text: '#d8d8d9',
    textLight: '#858689',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    borderLight: '#181F28',
    iconButtonBackground: '#FFFFFF',
    backgroundFadeGradient: '#121517',
  },
};
export const LightTheme = {
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: '#FCFCFC',
    backgroundSecondary: '#E9E9E9',
    backgroundNavigation: '#FFFFFF',
    footnote: '#DBDBDB',
    greyContentBackground: '#F2F2F2',
    text: 'black',
    textLight: '#7E7E7E',
    textSecondary: 'rgba(0, 0, 0, 0.5)',
    borderLight: '#EBEBEB',
    iconButtonBackground: '#FFFFFF',
    backgroundFadeGradient: '#F8F8F8',
  },
};
