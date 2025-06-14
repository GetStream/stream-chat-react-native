import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { SearchSourceState, TextComposerState, TextComposerSuggestion } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';

export const DEFAULT_LIST_HEIGHT = 200;

export type AutoCompleteSuggestionListProps = Partial<
  Pick<MessageInputContextValue, 'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'>
>;

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export const AutoCompleteSuggestionList = ({
  AutoCompleteSuggestionHeader: propsAutoCompleteSuggestionHeader,
  AutoCompleteSuggestionItem: propsAutoCompleteSuggestionItem,
}: AutoCompleteSuggestionListProps) => {
  const {
    AutoCompleteSuggestionHeader: contextAutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem: contextAutoCompleteSuggestionItem,
  } = useMessageInputContext();

  const AutoCompleteSuggestionHeader =
    propsAutoCompleteSuggestionHeader ?? contextAutoCompleteSuggestionHeader;
  const AutoCompleteSuggestionItem =
    propsAutoCompleteSuggestionItem ?? contextAutoCompleteSuggestionItem;

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } = useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const trigger = suggestions?.trigger;
  const queryText = suggestions?.query;

  const triggerType = {
    '/': 'command',
    ':': 'emoji',
    '@': 'mention',
  }[trigger ?? ''];

  const showList = useMemo(() => {
    return items && items?.length > 0;
  }, [items]);

  const {
    theme: {
      colors: { black, white },
      messageInput: {
        container: { maxHeight },
        suggestionsListContainer: { flatlist },
      },
    },
  } = useTheme();

  const renderItem = useCallback(
    ({ item }: { item: TextComposerSuggestion }) => {
      return AutoCompleteSuggestionItem ? (
        <AutoCompleteSuggestionItem itemProps={item} triggerType={triggerType} />
      ) : null;
    },
    [AutoCompleteSuggestionItem, triggerType],
  );

  const renderHeader = useCallback(() => {
    return AutoCompleteSuggestionHeader ? (
      <AutoCompleteSuggestionHeader queryText={queryText} triggerType={triggerType} />
    ) : null;
  }, [AutoCompleteSuggestionHeader, queryText, triggerType]);

  if (!showList || !triggerType) {
    return null;
  }

  return (
    <View style={[styles.container]}>
      <FlatList
        data={items}
        keyboardShouldPersistTaps='always'
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        style={[
          styles.flatlist,
          flatlist,
          { backgroundColor: white, maxHeight, shadowColor: black },
        ]}
        testID={'auto-complete-suggestion-list'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: DEFAULT_LIST_HEIGHT,
  },
  flatlist: {
    borderRadius: 8,
    elevation: 3,
    marginHorizontal: 8,
    shadowOffset: {
      height: 1,
      width: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
