import React from 'react';
import {
  FlatList,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

import {
  isSuggestionUser,
  Suggestion,
  SuggestionComponentType,
  Suggestions,
} from './SuggestionsContext';

import { useTheme } from '../themeContext/ThemeContext';

import { CommandsItem } from '../../components/AutoCompleteInput/CommandsItem';
import { MentionsItem } from '../../components/AutoCompleteInput/MentionsItem';

import type {
  DefaultCommandType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    bottom: 10,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: {
      height: -3,
      width: 0,
    },
    shadowOpacity: 0.05,
    zIndex: 100,
  },
  separator: {
    height: 0,
  },
  suggestionsItem: {
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    padding: 10,
  },
  wrapper: {
    position: 'absolute',
    width: '100%',
    zIndex: 90,
  },
});

const Separator: React.FC = () => {
  const {
    theme: {
      messageInput: {
        suggestions: { separator },
      },
    },
  } = useTheme();

  return <View style={[styles.separator, separator]} />;
};

const SuggestionsHeader: React.FC<{ title: string }> = ({ title }) => {
  const {
    theme: {
      messageInput: {
        suggestions: {
          container: { itemHeight },
          title: titleStyle,
        },
      },
    },
  } = useTheme();

  return (
    <Text style={[styles.title, { height: itemHeight }, titleStyle]}>
      {title}
    </Text>
  );
};

const SuggestionsItem: React.FC<TouchableOpacityProps> = (props) => {
  const { children, ...touchableOpacityProps } = props;
  const {
    theme: {
      messageInput: {
        suggestions: {
          container: { itemHeight },
          item,
        },
      },
    },
  } = useTheme();

  return (
    <TouchableOpacity
      {...touchableOpacityProps}
      style={[styles.suggestionsItem, { height: itemHeight }, item]}
    >
      {children}
    </TouchableOpacity>
  );
};

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
  backdropHeight: number | string;
  componentType: SuggestionComponentType<Co, Us>;
  handleDismiss: (event?: GestureResponderEvent) => void;
  marginLeft: number;
  suggestions: Suggestions<Co, Us>;
  suggestionsTitle: string;
  width: number | string;
};

export const SuggestionsList = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>(
  props: SuggestionsListProps<Co, Us>,
) => {
  const {
    active,
    backdropHeight,
    componentType: Component,
    handleDismiss,
    marginLeft,
    suggestions: { data, onSelect },
    suggestionsTitle,
    width,
  } = props;

  const {
    theme: {
      messageInput: {
        suggestions: {
          container: { itemHeight, maxHeight, ...container },
          wrapper,
        },
      },
    },
  } = useTheme();

  const renderItem = ({ item }: { item: Suggestion<Co, Us> }) => {
    if (isString(Component)) {
      switch (Component) {
        case 'MentionsItem':
          if (isSuggestionUser(item)) {
            return (
              <SuggestionsItem onPress={() => onSelect(item)}>
                <MentionsItem item={item} />
              </SuggestionsItem>
            );
          }
          return null;
        case 'CommandsItem':
          if (!isSuggestionUser(item)) {
            return (
              <SuggestionsItem onPress={() => onSelect(item)}>
                <CommandsItem item={item} />
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
    <TouchableOpacity
      onPress={handleDismiss}
      style={[styles.wrapper, { height: backdropHeight }, wrapper]}
    >
      <View
        style={[
          styles.container,
          {
            height: Math.min((data.length + 1) * itemHeight, maxHeight),
            marginLeft,
            width,
          },
          container,
        ]}
      >
        <FlatList
          data={data}
          ItemSeparatorComponent={Separator}
          keyboardShouldPersistTaps='always'
          keyExtractor={(item, index) =>
            `${item.name || (isSuggestionUser(item) ? item.id : '')}${index}`
          }
          ListHeaderComponent={<SuggestionsHeader title={suggestionsTitle} />}
          renderItem={renderItem}
        />
      </View>
    </TouchableOpacity>
  );
};
