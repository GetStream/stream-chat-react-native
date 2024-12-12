import { useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import type { DeepPartial, Theme } from 'stream-chat-react-native';

const getChatStyle = (colorScheme: ColorSchemeName): DeepPartial<Theme> => ({
  colors:
    colorScheme === 'dark'
      ? {
          accent_blue: '#005FFF',
          accent_green: '#20E070',
          accent_red: '#FF3742',
          bg_gradient_end: '#101214',
          bg_gradient_start: '#070A0D',
          bg_user: '#17191C',
          black: '#FFFFFF',
          blue_alice: '#00193D',
          border: '#141924',
          button_background: '#FFFFFF',
          button_text: '#005FFF',
          code_block: '#222222',
          grey: '#7A7A7A',
          grey_gainsboro: '#2D2F2F',
          grey_whisper: '#1C1E22',
          icon_background: '#FFFFFF',
          light_blue: '#001333',
          light_gray: '#1C1E22',
          modal_shadow: '#000000',
          overlay: '#FFFFFFCC', // CC = 80% opacity
          shadow_icon: '#00000080', // 80 = 50% opacity
          targetedMessageBackground: '#333024',
          text_high_emphasis: '#FFFFFF',
          text_low_emphasis: '#FFFFFF',
          transparent: 'transparent',
          white: '#101418',
          white_smoke: '#13151B',
          white_snow: '#070A0D',
        }
      : {
          accent_blue: '#005FFF',
          accent_green: '#20E070',
          accent_red: '#FF3742',
          bg_gradient_end: '#F7F7F7',
          bg_gradient_start: '#FCFCFC',
          black: '#000000',
          blue_alice: '#E9F2FF',
          border: '#00000014', // 14 = 8% opacity; top: x=0, y=-1; bottom: x=0, y=1
          button_background: '#005FFF',
          button_text: '#FFFFFF',
          grey: '#7A7A7A',
          grey_gainsboro: '#DBDBDB',
          grey_whisper: '#ECEBEB',
          icon_background: '#FFFFFF',
          light_blue: '#E0F0FF',
          light_gray: '#E9EAED',
          modal_shadow: '#00000099', // 99 = 60% opacity; x=0, y= 1, radius=4
          overlay: '#00000099', // 99 = 60% opacity
          shadow_icon: '#00000040', // 40 = 25% opacity; x=0, y=0, radius=4
          targetedMessageBackground: '#FBF4DD', // dark mode = #302D22
          text_high_emphasis: '#080707',
          text_low_emphasis: '#7E828B',
          transparent: 'transparent',
          white: '#FFFFFF',
          white_smoke: '#F2F2F2',
          white_snow: '#FCFCFC',
        },
  ...(colorScheme === 'dark'
    ? {
        messageSimple: {
          content: {
            receiverMessageBackgroundColor: '#2D2F2F',
            senderMessageBackgroundColor: '#101418',
          },
        },
      }
    : {}),
});

export const useStreamChatTheme = () => {
  const colorScheme = useColorScheme();

  const [chatStyle, setChatStyle] = useState(getChatStyle(colorScheme));

  useEffect(() => {
    setChatStyle(getChatStyle(colorScheme));
  }, [colorScheme]);

  return chatStyle;
};
