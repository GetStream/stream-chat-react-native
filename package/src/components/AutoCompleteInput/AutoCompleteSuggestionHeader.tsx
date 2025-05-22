import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { Lightning } from '../../icons/Lightning';
import { Smile } from '../../icons/Smile';

export type AutoCompleteSuggestionHeaderProps = {
  queryText?: string;
  triggerType?: string;
};

export const CommandsHeader: React.FC<AutoCompleteSuggestionHeaderProps> = () => {
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

  return (
    <View style={[styles.container, container]}>
      <Lightning fill={accent_blue} size={32} />
      <Text style={[styles.title, { color: grey }, title]} testID='commands-header-title'>
        {'Instant Commands'}
      </Text>
    </View>
  );
};

export const EmojiHeader: React.FC<AutoCompleteSuggestionHeaderProps> = ({ queryText }) => {
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

  return (
    <View style={[styles.container, container]}>
      <Smile pathFill={accent_blue} />
      <Text style={[styles.title, { color: grey }, title]} testID='emojis-header-title'>
        {`Emoji matching "${queryText}"`}
      </Text>
    </View>
  );
};

const UnMemoizedAutoCompleteSuggestionHeader = ({
  queryText,
  triggerType,
}: AutoCompleteSuggestionHeaderProps) => {
  if (triggerType === 'command') {
    return <CommandsHeader />;
  } else if (triggerType === 'emoji') {
    return <EmojiHeader queryText={queryText} />;
  } else {
    return null;
  }
};

const areEqual = (
  prevProps: AutoCompleteSuggestionHeaderProps,
  nextProps: AutoCompleteSuggestionHeaderProps,
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
  UnMemoizedAutoCompleteSuggestionHeader,
  areEqual,
);

export const AutoCompleteSuggestionHeader = (props: AutoCompleteSuggestionHeaderProps) => (
  <MemoizedAutoCompleteSuggestionHeader {...props} />
);

AutoCompleteSuggestionHeader.displayName =
  'AutoCompleteSuggestionHeader{messageInput{suggestions{Header}}}';

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
