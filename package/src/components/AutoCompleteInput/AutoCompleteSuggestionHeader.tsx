import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { SuggestionsContextValue } from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

import { Lightning } from '../../icons/Lightning';
import { Smile } from '../../icons/Smile';

export type AutoCompleteSuggestionHeaderPropsWithContext = Pick<
  SuggestionsContextValue,
  'triggerType' | 'queryText'
>;

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

const AutoCompleteSuggestionHeaderWithContext = ({
  queryText,
  triggerType,
}: AutoCompleteSuggestionHeaderPropsWithContext) => {
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
  } else if (triggerType === 'mention') {
    return null;
  } else {
    return null;
  }
};

const areEqual = (
  prevProps: AutoCompleteSuggestionHeaderPropsWithContext,
  nextProps: AutoCompleteSuggestionHeaderPropsWithContext,
) => {
  const { queryText: prevQueryText, triggerType: prevType } = prevProps;
  const { queryText: nextQueryText, triggerType: nextType } = nextProps;

  const typeEqual = prevType === nextType;
  if (!typeEqual) {
    return false;
  }

  const valueEqual = prevQueryText === nextQueryText;
  if (!valueEqual) {
    return false;
  }
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
