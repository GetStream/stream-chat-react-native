import React from 'react';
import { FlatList, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import {
  isSuggestionCommand,
  isSuggestionEmoji,
  isSuggestionUser,
  Suggestion,
  SuggestionComponentType,
  Suggestions,
  useSuggestionsContext,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultUserType } from '../../types/types';

import type { AutoCompleteSuggestionHeaderProps } from './AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from './AutoCompleteSuggestionItem';
import type { SuggestionsContextValue } from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

type AutoCompleteSuggestionListComponentProps<Us extends DefaultUserType = DefaultUserType> = {
  active: boolean;
  headerProps: AutoCompleteSuggestionHeaderProps;
  suggestions: Suggestions<Us>;
  type: SuggestionComponentType;
};

export type AutoCompleteSuggestionListPropsWithContext<
  Us extends DefaultUserType = DefaultUserType,
> = AutoCompleteSuggestionListComponentProps<Us> &
  Pick<SuggestionsContextValue, 'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem'>;

const SuggestionsItem: React.FC<TouchableOpacityProps> = (props) => {
  const { children, ...touchableOpacityProps } = props;
  return <TouchableOpacity {...touchableOpacityProps}>{children}</TouchableOpacity>;
};

SuggestionsItem.displayName = 'SuggestionsHeader{messageInput{suggestions}}';

export const AutoCompleteSuggestionListWithContext = <Us extends DefaultUserType = DefaultUserType>(
  props: AutoCompleteSuggestionListPropsWithContext<Us>,
) => {
  const {
    AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem,
    headerProps: { type, value },
    suggestions: { data, onSelect },
    type: triggerType,
  } = props;

  const {
    theme: {
      messageInput: {
        container: { maxHeight },
        suggestions: { item: itemStyle },
      },
    },
  } = useTheme();

  const renderItem = ({ index, item }: { index: number; item: Suggestion<Us> }) => {
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
                <AutoCompleteSuggestionItem itemProps={item} type={type} />
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
                <AutoCompleteSuggestionItem itemProps={item} type={type} />
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
                <AutoCompleteSuggestionItem itemProps={item} type={type} />
              )}
            </SuggestionsItem>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <FlatList
      data={data}
      keyboardShouldPersistTaps='always'
      keyExtractor={(item, index) =>
        `${item.name || (isSuggestionUser(item) ? item.id : '')}${index}`
      }
      ListHeaderComponent={
        AutoCompleteSuggestionHeader ? (
          <AutoCompleteSuggestionHeader type={type} value={value} />
        ) : null
      }
      renderItem={renderItem}
      style={{
        maxHeight,
      }}
    />
  );
};

const areEqual = <Us extends DefaultUserType = DefaultUserType>(
  prevProps: AutoCompleteSuggestionListPropsWithContext<Us>,
  nextProps: AutoCompleteSuggestionListPropsWithContext<Us>,
) => {
  const {
    active: prevActive,
    headerProps: prevHeaderProps,
    suggestions: prevSuggestions,
    type: prevType,
  } = prevProps;
  const {
    active: nextActive,
    headerProps: nextHeaderProps,
    suggestions: nextSuggestions,
    type: nextType,
  } = nextProps;

  const activeEqual = prevActive === nextActive;
  if (!activeEqual) return false;

  const headerPropsEqual = prevHeaderProps === nextHeaderProps;
  if (!headerPropsEqual) return false;

  const suggestionsEqual = prevSuggestions === nextSuggestions;
  if (!suggestionsEqual) return false;

  const typeEqual = prevType === nextType;
  if (!typeEqual) return false;

  return true;
};

const MemoizedAutoCompleteSuggestionList = React.memo(
  AutoCompleteSuggestionListWithContext,
  areEqual,
) as typeof AutoCompleteSuggestionListWithContext;

export type AutoCompleteSuggestionListProps<Us extends DefaultUserType = DefaultUserType> =
  AutoCompleteSuggestionListComponentProps<Us> & {
    AutoCompleteSuggestionHeader?: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
    AutoCompleteSuggestionItem?: React.ComponentType<AutoCompleteSuggestionItemProps<Us>>;
  };

export const AutoCompleteSuggestionList = <Us extends DefaultUserType = DefaultUserType>(
  props: AutoCompleteSuggestionListProps<Us>,
) => {
  const { AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem } = useSuggestionsContext<Us>();
  return (
    <MemoizedAutoCompleteSuggestionList
      {...{
        AutoCompleteSuggestionHeader,
        AutoCompleteSuggestionItem,
      }}
      {...props}
    />
  );
};

AutoCompleteSuggestionList.displayName =
  'AutoCompleteSuggestionList{messageInput{suggestions{List}}}';
