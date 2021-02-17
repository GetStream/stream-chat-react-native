import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Lightning } from '../../icons/Lightning';

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

export const CommandsHeader: React.FC = () => {
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: {
        suggestions: {
          commandsHeader: { container, title },
        },
      },
    },
  } = useTheme();
  const { t } = useTranslationContext();

  return (
    <View style={[styles.container, container]}>
      <Lightning pathFill={accent_blue} />
      <Text
        style={[styles.title, { color: grey }, title]}
        testID='commands-header-title'
      >
        {t('Instant Commands')}
      </Text>
    </View>
  );
};

CommandsHeader.displayName =
  'CommandsHeader{messageInput{suggestions{commandsHeader}}}';
