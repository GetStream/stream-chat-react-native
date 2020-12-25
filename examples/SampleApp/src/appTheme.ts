import { DefaultTheme } from '@react-navigation/native';

export const DarkTheme = {
  colors: {
    accent_blue: '#005FFF',
    accent_green: '#20E070',
    accent_red: '#FF3742',
    bg_gradient_end: '#101214',
    bg_gradient_start: '#070A0D',
    black: '#FFFFFF',
    blue_alice: '#00193D',
    border: '#141924',
    grey: '#7A7A7A',
    grey_gainsboro: '#2D2F2F',
    grey_whisper: '#1C1E22',
    modal_shadow: '#000000',
    overlay: '#00000066', // 66 = 40% opacity
    overlay_dark: '#FFFFFFCC', // CC = 80% opacity
    shadow_icon: '#00000080', // 80 = 50% opacity
    targetedMessageBackground: '#302D22',
    transparent: 'transparent',
    white: '#101418',
    white_smoke: '#13151B',
    white_snow: '#070A0D',
    // ...DefaultTheme.colors,
    // background: '#13151B',
    // backgroundSecondary: '#212527',
    // backgroundNavigation: '#0B0E14',
    // dateStampBackground: 'rgba(255,255,255,0.6)',
    // footnote: '#2F3134',
    // greyContentBackground: '#DBDBDB',
    // success: '#20E070',
    // text: '#d8d8d9',
    // textInverted: 'black',
    // textLight: '#7A7A7A',
    // textSecondary: 'rgba(255, 255, 255, 0.5)',
    // borderLight: '#181F28',
    // iconButtonBackground: '#FFFFFF',
    // backgroundFadeGradient: '#121517',
  },
  dark: true,
};
export const LightTheme = {
  colors: {
    ...DefaultTheme.colors,
    accent_blue: '#005FFF',
    accent_green: '#20E070',
    accent_red: '#FF3742',
    bg_gradient_end: '#F7F7F7',
    bg_gradient_start: '#FCFCFC',
    black: '#000000',
    blue_alice: '#E9F2FF',
    border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
    grey: '#7A7A7A',
    grey_gainsboro: '#DBDBDB',
    grey_whisper: '#ECEBEB',
    modal_shadow: '#00000099', // 99 = 60% opacity; x=0, y= 1, radius=4
    overlay: '#00000033', // 33 = 20% opacity
    overlay_dark: '#00000099', // 99 = 60% opacity
    shadow_icon: '#00000040', // 40 = 25% opacity; x=0, y=0, radius=4
    targetedMessageBackground: '#FBF4DD', // dark mode = #302D22
    transparent: 'transparent',
    white: '#FFFFFF',
    white_smoke: '#F2F2F2',
    white_snow: '#F2F2F2',
    // background: '#FCFCFC',
    // backgroundSecondary: '#E9E9E9',
    // backgroundNavigation: '#FFFFFF',
    // dateStampBackground: 'rgba(0,0,0,0.6)',
    // footnote: '#DBDBDB',
    // greyContentBackground: '#F2F2F2',
    // success: '#20E070',
    // text: 'black',
    // textInverted: 'white',
    // textLight: '#7E7E7E',
    // textSecondary: 'rgba(0, 0, 0, 0.5)',
    // borderLight: '#EBEBEB',
    // iconButtonBackground: '#FFFFFF',
    // backgroundFadeGradient: '#F8F8F8',
  },
  dark: false,
};
