import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Lightning } from '../../icons/Lightning';
import { Smile } from '../../icons/Smile';

export type AutoCompleteSuggestionHeaderPropsWithContext = {
  type: string;
  value?: string;
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

const AutoCompleteSuggestionHeaderWithContext = (
  props: AutoCompleteSuggestionHeaderPropsWithContext,
) => {
  const { type, value } = props;
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

  if (type === 'command') {
    return (
      <View style={[styles.container, container]}>
        <Lightning pathFill={accent_blue} />
        <Text style={[styles.title, { color: grey }, title]} testID='commands-header-title'>
          {t('Instant Commands')}
        </Text>
      </View>
    );
  } else if (type === 'emoji') {
    return (
      <View style={[styles.container, container]}>
        <Smile pathFill={accent_blue} />
        <Text style={[styles.title, { color: grey }, title]} testID='emojis-header-title'>
          {t('Emoji matching') + ' "' + value + '"'}
        </Text>
      </View>
    );
  } else if (type === 'mention') {
    return null;
  } else return null;
};

const areEqual = (
  prevProps: AutoCompleteSuggestionHeaderPropsWithContext,
  nextProps: AutoCompleteSuggestionHeaderPropsWithContext,
) => {
  const { type: prevType, value: prevValue } = prevProps;
  const { type: nextType, value: nextValue } = nextProps;

  const typeEqual = prevType === nextType;
  if (!typeEqual) return false;

  const valueEqual = prevValue === nextValue;
  if (!valueEqual) return false;
  return true;
};

const MemoizedAutoCompleteSuggestionHeader = React.memo(
  AutoCompleteSuggestionHeaderWithContext,
  areEqual,
) as typeof AutoCompleteSuggestionHeaderWithContext;

export type AutoCompleteSuggestionHeaderProps = AutoCompleteSuggestionHeaderPropsWithContext;

export const AutoCompleteSuggestionHeader = (props: AutoCompleteSuggestionHeaderProps) => (
  <MemoizedAutoCompleteSuggestionHeader {...props} />
);

AutoCompleteSuggestionHeader.displayName =
  'AutoCompleteSuggestionHeader{messageInput{suggestions{Header}}}';
