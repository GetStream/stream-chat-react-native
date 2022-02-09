import React from 'react';
import { FlatList, TouchableOpacity, TouchableOpacityProps } from 'react-native';

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
import type { DefaultStreamChatGenerics } from '../../types/types';

type AutoCompleteSuggestionListComponentProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<SuggestionsContextValue, 'queryText' | 'triggerType'> & {
  active: boolean;
  data: Suggestion<StreamChatClient>[];
  onSelect: (item: Suggestion<StreamChatClient>) => void;
};

export type AutoCompleteSuggestionListPropsWithContext<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  SuggestionsContextValue<StreamChatClient>,
  'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'
> &
  AutoCompleteSuggestionListComponentProps<StreamChatClient>;

const SuggestionsItem: React.FC<TouchableOpacityProps> = (props) => {
  const { children, ...touchableOpacityProps } = props;
  return <TouchableOpacity {...touchableOpacityProps}>{children}</TouchableOpacity>;
};

SuggestionsItem.displayName = 'SuggestionsHeader{messageInput{suggestions}}';

export const AutoCompleteSuggestionListWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AutoCompleteSuggestionListPropsWithContext<StreamChatClient>,
) => {
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
      messageInput: {
        container: { maxHeight },
        suggestions: { item: itemStyle },
        suggestionsListContainer: { flatlist },
      },
    },
  } = useTheme();

  const renderItem = ({ index, item }: { index: number; item: Suggestion<StreamChatClient> }) => {
    switch (triggerType) {
      case 'mention':
        if (isSuggestionUser(item)) {
          return (
            <SuggestionsItem
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
  );
};

const areEqual = <StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: AutoCompleteSuggestionListPropsWithContext<StreamChatClient>,
  nextProps: AutoCompleteSuggestionListPropsWithContext<StreamChatClient>,
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
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = AutoCompleteSuggestionListComponentProps<StreamChatClient> & {
  AutoCompleteSuggestionHeader?: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem?: React.ComponentType<
    AutoCompleteSuggestionItemProps<StreamChatClient>
  >;
};

export const AutoCompleteSuggestionList = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: AutoCompleteSuggestionListProps<StreamChatClient>,
) => {
  const { AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem } =
    useSuggestionsContext<StreamChatClient>();
  return (
    <MemoizedAutoCompleteSuggestionList
      {...{ AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem }}
      {...props}
    />
  );
};

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
