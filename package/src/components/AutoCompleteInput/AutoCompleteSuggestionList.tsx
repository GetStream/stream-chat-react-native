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
import type { DefaultCommandType, DefaultUserType, UnknownType } from '../../types/types';

type AutoCompleteSuggestionListComponentProps<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = Pick<SuggestionsContextValue, 'queryText' | 'triggerType'> & {
  active: boolean;
  data: Suggestion<Co, Us>[];
  onSelect: (item: Suggestion<Co, Us>) => void;
};

export type AutoCompleteSuggestionListPropsWithContext<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = Pick<
  SuggestionsContextValue<Co, Us>,
  'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'
> &
  AutoCompleteSuggestionListComponentProps<Co, Us>;

const SuggestionsItem: React.FC<TouchableOpacityProps> = (props) => {
  const { children, ...touchableOpacityProps } = props;
  return <TouchableOpacity {...touchableOpacityProps}>{children}</TouchableOpacity>;
};

SuggestionsItem.displayName = 'SuggestionsHeader{messageInput{suggestions}}';

export const AutoCompleteSuggestionListWithContext = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>(
  props: AutoCompleteSuggestionListPropsWithContext<Co, Us>,
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
  } = useTheme('AutoCompleteSuggestionList');

  const renderItem = ({ index, item }: { index: number; item: Suggestion<Co, Us> }) => {
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

const areEqual = <Co extends string = DefaultCommandType, Us extends UnknownType = DefaultUserType>(
  prevProps: AutoCompleteSuggestionListPropsWithContext<Co, Us>,
  nextProps: AutoCompleteSuggestionListPropsWithContext<Co, Us>,
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
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = AutoCompleteSuggestionListComponentProps<Co, Us> & {
  AutoCompleteSuggestionHeader?: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem?: React.ComponentType<AutoCompleteSuggestionItemProps<Co, Us>>;
};

export const AutoCompleteSuggestionList = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>(
  props: AutoCompleteSuggestionListProps<Co, Us>,
) => {
  const { AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem } = useSuggestionsContext<
    Co,
    Us
  >('AutoCompleteSuggestionList');

  return (
    <MemoizedAutoCompleteSuggestionList
      {...{ AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem }}
      {...props}
    />
  );
};

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
