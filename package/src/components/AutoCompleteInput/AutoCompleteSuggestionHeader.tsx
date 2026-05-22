import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { Smile } from '../../icons/emoji';
import { primitives } from '../../theme';

export type AutoCompleteSuggestionHeaderProps = {
  queryText?: string;
  triggerType?: string;
};

export const CommandsHeader: React.FC<AutoCompleteSuggestionHeaderProps> = () => {
  const {
    theme: {
      semantics,
      messageComposer: {
        suggestions: {
          header: { container, title },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <Text
        style={[styles.title, { color: semantics.textTertiary }, title]}
        testID='commands-header-title'
      >
        {'Instant Commands'}
      </Text>
    </View>
  );
};

export const EmojiHeader: React.FC<AutoCompleteSuggestionHeaderProps> = ({ queryText }) => {
  const {
    theme: {
      messageComposer: {
        suggestions: {
          header: { container, title },
        },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, container]}>
      <Smile pathFill={semantics.accentPrimary} />
      <Text style={[styles.title, title]} testID='emojis-header-title'>
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
  'AutoCompleteSuggestionHeader{messageComposer{suggestions{Header}}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        padding: 8,
      },
      title: {
        fontSize: primitives.typographyFontSizeSm,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightMedium,
        paddingLeft: 8,
        color: semantics.textSecondary,
      },
    });
  }, [semantics]);
};
