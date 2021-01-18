import React from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import { CommandsItem } from './CommandsItem';
import { EmojisItem } from './EmojisItem';
import { MentionsItem } from './MentionsItem';

import {
  isSuggestionCommand,
  isSuggestionEmoji,
  isSuggestionUser,
  Suggestion,
  SuggestionComponentType,
  Suggestions,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type {
  DefaultCommandType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  emojiItem: { paddingVertical: 10 },
});

const SuggestionsItem: React.FC<TouchableOpacityProps> = (props) => {
  const { children, ...touchableOpacityProps } = props;
  return (
    <TouchableOpacity {...touchableOpacityProps}>{children}</TouchableOpacity>
  );
};

SuggestionsItem.displayName = 'SuggestionsHeader{messageInput{suggestions}}';

const isString = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>(
  component: SuggestionComponentType<Co, Us>,
): component is string => typeof component === 'string';

export type SuggestionsListProps<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = {
  active: boolean;
  componentType: SuggestionComponentType<Co, Us>;
  suggestions: Suggestions<Co, Us>;
  suggestionsTitle?: React.ReactElement;
};

export const SuggestionsList = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>(
  props: SuggestionsListProps<Co, Us>,
) => {
  const {
    active,
    componentType: Component,
    suggestions: { data, onSelect },
    suggestionsTitle: SuggestionsTitle,
  } = props;

  const {
    theme: {
      messageInput: {
        suggestions: {
          container: { maxHeight },
          item: itemStyle,
        },
      },
    },
  } = useTheme();

  const renderItem = ({
    index,
    item,
  }: {
    index: number;
    item: Suggestion<Co, Us>;
  }) => {
    if (isString(Component)) {
      switch (Component) {
        case 'MentionsItem':
          if (isSuggestionUser(item)) {
            return (
              <SuggestionsItem
                onPress={() => onSelect(item)}
                style={[
                  {
                    paddingBottom: index === data.length - 1 ? 8 : 0,
                    paddingTop: index === 0 ? 8 : 0,
                  },
                  itemStyle,
                ]}
              >
                <MentionsItem item={item} />
              </SuggestionsItem>
            );
          }
          return null;
        case 'CommandsItem':
          if (isSuggestionCommand(item)) {
            return (
              <SuggestionsItem
                onPress={() => onSelect(item)}
                style={[itemStyle]}
              >
                <CommandsItem item={item} />
              </SuggestionsItem>
            );
          }
          return null;
        case 'EmojisItem':
          if (isSuggestionEmoji(item)) {
            return (
              <SuggestionsItem
                onPress={() => onSelect(item)}
                style={[styles.emojiItem, itemStyle]}
              >
                <EmojisItem item={item} />
              </SuggestionsItem>
            );
          }
          return null;
        default:
          return null;
      }
    }

    return (
      <SuggestionsItem onPress={() => onSelect(item)}>
        {React.cloneElement(Component, { item })}
      </SuggestionsItem>
    );
  };

  if (!active || data.length === 0) return null;

  return (
    <FlatList
      data={data}
      keyboardShouldPersistTaps='always'
      keyExtractor={(item, index) =>
        `${item.name || (isSuggestionUser(item) ? item.id : '')}${index}`
      }
      ListHeaderComponent={SuggestionsTitle ? SuggestionsTitle : undefined}
      renderItem={renderItem}
      style={{
        maxHeight,
      }}
    />
  );
};

SuggestionsList.displayName = 'SuggestionsList{messageInput{suggestions}}';
