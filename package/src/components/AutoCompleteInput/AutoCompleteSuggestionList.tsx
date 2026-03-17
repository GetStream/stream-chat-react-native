import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import Animated, { LinearTransition, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { SearchSourceState, TextComposerState, TextComposerSuggestion } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';

export const DEFAULT_LIST_HEIGHT = 208;

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
      messageInput: {
        container: { maxHeight },
      },
    },
  } = useTheme();
  const styles = useStyles();

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

  const loadMore = useStableCallback(() => suggestions?.searchSource.search());

  if (!showList || !triggerType) {
    return null;
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(200)}
      layout={LinearTransition.duration(200)}
      style={styles.container}
    >
      <FlatList
        data={items}
        keyboardShouldPersistTaps='always'
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        renderItem={renderItem}
        style={[styles.flatlist, { maxHeight }]}
        testID={'auto-complete-suggestion-list'}
      />
    </Animated.View>
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageInput: {
        suggestionsListContainer: { flatlist },
      },
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          maxHeight: DEFAULT_LIST_HEIGHT,
          backgroundColor: semantics.backgroundCoreElevation1,
          borderTopWidth: 1,
          borderColor: semantics.borderCoreDefault,
        },
        flatlist: {
          backgroundColor: semantics.backgroundCoreElevation1,
          shadowColor: semantics.textOnAccent,
          borderRadius: 8,
          elevation: 3,
          marginHorizontal: 8,
          shadowOffset: {
            height: 1,
            width: 0,
          },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
          ...flatlist,
        },
      }),
    [semantics, flatlist],
  );
};

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
