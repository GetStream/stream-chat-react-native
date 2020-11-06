/* eslint-disable sort-keys */
// src/appTheme.js
import { DefaultTheme } from '@react-navigation/native';

export const DarkTheme = {
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#0E1723',
    backgroundSecondary: '#212527',
    backgroundNavigation: '#0E131B',
    text: '#d8d8d9',
    textSecondary: 'rgba(255, 255, 255, 0.5)',
    borderLight: '#181F28',
  },
};
export const LightTheme = {
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: '#FCFCFC',
    backgroundSecondary: '#E9E9E9',
    backgroundNavigation: '#FFFFFF',
    text: 'black',
    textSecondary: 'rgba(0, 0, 0, 0.5)',
    borderLight: '#EBEBEB',
  },
};
