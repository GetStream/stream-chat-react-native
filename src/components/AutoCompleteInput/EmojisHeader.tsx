import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Smile } from '../../icons/Smile';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 8,
  },
  title: {
    fontSize: 14,
    paddingLeft: 8,
  },
});

export type EmojisHeaderProps = { title: string };

export const EmojisHeader: React.FC<EmojisHeaderProps> = ({ title = '' }) => {
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: {
        suggestions: {
          emojisHeader: { container, title: titleStyle },
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <Smile pathFill={accent_blue} />
      <Text
        style={[styles.title, { color: grey }, titleStyle]}
        testID='emojis-header-title'
      >
        {t('Emoji matching') + ` "${title}"`}
      </Text>
    </View>
  );
};

EmojisHeader.displayName =
  'EmojisHeader{messageInput{suggestions{emojisHeader}}}';
