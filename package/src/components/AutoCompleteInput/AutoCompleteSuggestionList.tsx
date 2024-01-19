import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, PressableProps, StyleSheet, View } from 'react-native';

import type { AutoCompleteSuggestionHeaderProps } from './AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from './AutoCompleteSuggestionItem';

import {
  isSuggestionCommand,
  isSuggestionEmoji,
  isSuggestionUser,
  Suggestion,
  SuggestionsContextValue,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { FlatList } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';

const AUTO_COMPLETE_SUGGESTION_LIST_HEADER = 30;

type AutoCompleteSuggestionListComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<SuggestionsContextValue, 'queryText' | 'triggerType'> & {
  active: boolean;
  data: Suggestion<StreamChatGenerics>[];
  onSelect: (item: Suggestion<StreamChatGenerics>) => void;
};

export type AutoCompleteSuggestionListPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  SuggestionsContextValue<StreamChatGenerics>,
  'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'
> &
  AutoCompleteSuggestionListComponentProps<StreamChatGenerics>;

const SuggestionsItem: React.FC<PressableProps> = (props) => {
  const { children, ...pressableProps } = props;
  return <Pressable {...pressableProps}>{children}</Pressable>;
};

SuggestionsItem.displayName = 'SuggestionsHeader{messageInput{suggestions}}';

export const AutoCompleteSuggestionListWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AutoCompleteSuggestionListPropsWithContext<StreamChatGenerics>,
) => {
  const [itemHeight, setItemHeight] = useState<number>(0);
  const {
    active,
    AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem,
    data,
    onSelect,
    queryText,
    triggerType,
  } = props;

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
    let totalItemHeight;
    if (triggerType === 'emoji') {
      totalItemHeight = data.length < 7 ? data.length * itemHeight : itemHeight * 6;
    } else {
      totalItemHeight = data.length < 4 ? data.length * itemHeight : itemHeight * 3;
    }

    return triggerType === 'emoji' || triggerType === 'command'
      ? totalItemHeight + AUTO_COMPLETE_SUGGESTION_LIST_HEADER
      : totalItemHeight;
  }, [itemHeight, data.length]);

  const onLayoutHandler = (event: LayoutChangeEvent) => {
    const { height: newHeight } = event.nativeEvent.layout;
    setItemHeight((prevHeight) => {
      if (prevHeight !== newHeight) return newHeight;
      return prevHeight;
    });
  };

  const renderItem = ({ index, item }: { index: number; item: Suggestion<StreamChatGenerics> }) => {
    switch (triggerType) {
      case 'mention':
        if (isSuggestionUser(item)) {
          return (
            <SuggestionsItem
              onLayout={onLayoutHandler}
              onPress={() => {
                onSelect(item);
              }}
              style={[
                {
                  paddingBottom: index === data.length - 1 ? 8 : 0,
                  paddingTop: index === 0 ? 8 : 0,
                },
                itemStyle,
              ]}
            >
              {AutoCompleteSuggestionItem && (
                <AutoCompleteSuggestionItem itemProps={item} triggerType={triggerType} />
              )}
            </SuggestionsItem>
          );
        }
        return null;
      case 'command':
        if (isSuggestionCommand(item)) {
          return (
            <SuggestionsItem
              onLayout={onLayoutHandler}
              onPress={() => {
                onSelect(item);
              }}
              style={[itemStyle]}
            >
              {AutoCompleteSuggestionItem && (
                <AutoCompleteSuggestionItem itemProps={item} triggerType={triggerType} />
              )}
            </SuggestionsItem>
          );
        }
        return null;
      case 'emoji':
        if (isSuggestionEmoji(item)) {
          return (
            <SuggestionsItem
              onLayout={onLayoutHandler}
              onPress={() => {
                onSelect(item);
              }}
              style={[itemStyle]}
            >
              {AutoCompleteSuggestionItem && (
                <AutoCompleteSuggestionItem itemProps={item} triggerType={triggerType} />
              )}
            </SuggestionsItem>
          );
        }
        return null;
      default:
        return null;
    }
  };

  if (!active || data.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: white, height: flatlistHeight }]}>
      <FlatList
        data={data}
        keyboardShouldPersistTaps='always'
        keyExtractor={(item, index) =>
          `${item.name || (isSuggestionUser(item) ? item.id : '')}${index}`
        }
        ListHeaderComponent={
          AutoCompleteSuggestionHeader ? (
            <AutoCompleteSuggestionHeader queryText={queryText} triggerType={triggerType} />
          ) : null
        }
        renderItem={renderItem}
        style={[flatlist, { maxHeight }]}
      />
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AutoCompleteSuggestionListPropsWithContext<StreamChatGenerics>,
  nextProps: AutoCompleteSuggestionListPropsWithContext<StreamChatGenerics>,
) => {
  const {
    active: prevActive,
    data: prevData,
    queryText: prevQueryText,
    triggerType: prevType,
  } = prevProps;
  const {
    active: nextActive,
    data: nextData,
    queryText: nextQueryText,
    triggerType: nextType,
  } = nextProps;

  const activeEqual = prevActive === nextActive;
  if (!activeEqual) return false;

  const queryTextEqual = prevQueryText === nextQueryText;
  if (!queryTextEqual) return false;

  const dataEqual = prevData === nextData;
  if (!dataEqual) return false;

  const typeEqual = prevType === nextType;
  if (!typeEqual) return false;

  return true;
};

const MemoizedAutoCompleteSuggestionList = React.memo(
  AutoCompleteSuggestionListWithContext,
  areEqual,
) as typeof AutoCompleteSuggestionListWithContext;

export type AutoCompleteSuggestionListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = AutoCompleteSuggestionListComponentProps<StreamChatGenerics> & {
  AutoCompleteSuggestionHeader?: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem?: React.ComponentType<
    AutoCompleteSuggestionItemProps<StreamChatGenerics>
  >;
};

export const AutoCompleteSuggestionList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AutoCompleteSuggestionListProps<StreamChatGenerics>,
) => {
  const { AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem } =
    useSuggestionsContext<StreamChatGenerics>();

  return (
    <MemoizedAutoCompleteSuggestionList
      {...{ AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem }}
      {...props}
    />
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
