import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { Lightning } from '../../icons/Lightning';
import { Smile } from '../../icons/Smile';

export type AutoCompleteSuggestionHeaderProps = {
  queryText: string;
  triggerType: string;
};

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

export const AutoCompleteSuggestionHeader = ({
  queryText,
  triggerType,
}: AutoCompleteSuggestionHeaderProps) => {
  const { t } = useTranslationContext();
  const {
    theme: {
      colors: { accent_blue, grey },
      messageInput: {
        suggestions: {
          header: { container, title },
        },
      },
    },
  } = useTheme();

  if (triggerType === 'command') {
    return (
      <View style={[styles.container, container]}>
        <Lightning fill={accent_blue} size={32} />
        <Text style={[styles.title, { color: grey }, title]} testID='commands-header-title'>
          {t<string>('Instant Commands')}
        </Text>
      </View>
    );
  } else if (triggerType === 'emoji') {
    return (
      <View style={[styles.container, container]}>
        <Smile pathFill={accent_blue} />
        <Text style={[styles.title, { color: grey }, title]} testID='emojis-header-title'>
          {t<string>('Emoji matching') + ' "' + queryText + '"'}
        </Text>
      </View>
    );
  } else {
    return null;
  }
};

AutoCompleteSuggestionHeader.displayName =
  'AutoCompleteSuggestionHeader{messageInput{suggestions{Header}}}';
