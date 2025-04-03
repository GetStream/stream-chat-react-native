import React, { useMemo, useState } from 'react';
import { FlatList, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { SearchSourceState, TextComposerState, TextComposerSuggestion } from 'stream-chat';

import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import {
  isSuggestionUser,
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';

const AUTO_COMPLETE_SUGGESTION_LIST_HEADER_HEIGHT = 50;

export type AutoCompleteSuggestionListProps = Partial<
  Pick<SuggestionsContextValue, 'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'>
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
  } = useSuggestionsContext();

  const [itemHeight, setItemHeight] = useState<number>(0);

  const AutoCompleteSuggestionHeader =
    propsAutoCompleteSuggestionHeader ?? contextAutoCompleteSuggestionHeader;
  const AutoCompleteSuggestionItem =
    propsAutoCompleteSuggestionItem ?? contextAutoCompleteSuggestionItem;

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions, text } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } = useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const trigger = suggestions?.trigger;

  const showList = useMemo(() => {
    return items && items?.length > 0 && trigger;
  }, [items, trigger]);

  const triggerType = {
    '/': 'command',
    ':': 'emoji',
    '@': 'mention',
  }[trigger ?? ''];

  const {
    theme: {
      colors: { white },
      messageInput: {
        container: { maxHeight },
        suggestions: { item: itemStyle },
        suggestionsListContainer: { flatlist },
      },
    },
  } = useTheme();

  const flatlistHeight = useMemo(() => {
    const data = items ?? [];
    let totalItemHeight;
    if (triggerType === 'emoji') {
      totalItemHeight = data.length < 7 ? data.length * itemHeight : itemHeight * 6;
    } else {
      totalItemHeight = data.length < 4 ? data.length * itemHeight : itemHeight * 3;
    }

    return triggerType === 'emoji' || triggerType === 'command'
      ? totalItemHeight + AUTO_COMPLETE_SUGGESTION_LIST_HEADER_HEIGHT
      : totalItemHeight;
  }, [itemHeight, items, triggerType]);

  const renderItem = ({ item }: { item: TextComposerSuggestion }) => {
    const handleSelect = () => {
      // TODO: handle select
      textComposer.handleSelect(item);
    };

    switch (triggerType) {
      case 'command':
      case 'mention':
      case 'emoji':
        return (
          <Pressable
            onLayout={(event: LayoutChangeEvent) => setItemHeight(event.nativeEvent.layout.height)}
            onPress={handleSelect}
            style={({ pressed }) => [{ opacity: pressed ? 0.2 : 1 }, itemStyle]}
          >
            {AutoCompleteSuggestionItem && (
              <AutoCompleteSuggestionItem itemProps={item} triggerType={triggerType} />
            )}
          </Pressable>
        );
      default:
        return null;
    }
  };

  if (!showList) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: white, height: flatlistHeight }]}>
      <FlatList
        data={items}
        keyboardShouldPersistTaps='always'
        keyExtractor={(item, index) =>
          `${item.id || (isSuggestionUser(item) ? item.id : '')}${index}`
        }
        ListHeaderComponent={
          AutoCompleteSuggestionHeader ? (
            <AutoCompleteSuggestionHeader queryText={text} triggerType={triggerType} />
          ) : null
        }
        renderItem={renderItem}
        style={[flatlist, { maxHeight }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    elevation: 3,
    marginHorizontal: 8,
    marginVertical: 8,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.15,
  },
});

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
