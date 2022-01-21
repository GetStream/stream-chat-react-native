import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { vw } from '../../utils/utils';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  text: {
    fontSize: 12,
  },
});

export const InlineUnreadIndicator: React.FC = () => {
  const {
    theme: {
      colors: { bg_gradient_end, bg_gradient_start, grey },
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
    },
  } = useTheme('InlineUnreadIndicator');
  const { t } = useTranslationContext('InlineUnreadIndicator');

  return (
    <View style={[styles.container, container]}>
      <Svg height={24} style={{ position: 'absolute' }} width={vw(100)}>
        <Rect fill='url(#gradient)' height={24} width={vw(100)} x={0} y={0} />
        <Defs>
          <LinearGradient gradientUnits='userSpaceOnUse' id='gradient' x1={0} x2={0} y1={24} y2={0}>
            <Stop offset={1} stopColor={bg_gradient_end} stopOpacity={1} />
            <Stop offset={0} stopColor={bg_gradient_start} stopOpacity={1} />
          </LinearGradient>
        </Defs>
      </Svg>
      <Text style={[styles.text, { color: grey }, text]}>{t('Unread Messages')}</Text>
    </View>
  );
};
