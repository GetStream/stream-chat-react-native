import React from 'react';
import { FlatList, GestureResponderEvent } from 'react-native';

import {
  isSuggestionUser,
  Suggestion,
  SuggestionComponentType,
  Suggestions,
} from './SuggestionsContext';

import { CommandsItem } from '../../components/AutoCompleteInput/CommandsItem';
import { MentionsItem } from '../../components/AutoCompleteInput/MentionsItem';
import { styled } from '../../styles/styledComponents';

import type {
  DefaultCommandType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const Container = styled.View<{ length: number }>`
  background-color: white;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  bottom: 10px;
  height: ${({ length, theme }) =>
    Math.min(
      length * theme.messageInput.suggestions.container.itemHeight,
      theme.messageInput.suggestions.container.maxHeight,
    )}px;
  position: absolute;
  shadow-color: #000;
  shadow-offset: 0px -3px;
  shadow-opacity: 0.05;
  z-index: 100;
  ${({ theme }) => theme.messageInput.suggestions.container.css};
`;

const Separator = styled.View`
  height: 0px;
  ${({ theme }) => theme.messageInput.suggestions.separator.css};
`;

const SuggestionsItem = styled.TouchableOpacity`
  height: ${({ theme }) => theme.messageInput.suggestions.container.itemHeight};
  justify-content: center;
  ${({ theme }) => theme.messageInput.suggestions.item.css};
`;

const Title = styled.Text`
  font-weight: bold;
  height: ${({ theme }) => theme.messageInput.suggestions.container.itemHeight};
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.title.css};
`;

const Wrapper = styled.TouchableOpacity`
  position: absolute;
  width: 100%;
  z-index: 90;
  ${({ theme }) => theme.messageInput.suggestions.wrapper.css};
`;

const SuggestionsHeader: React.FC<{ title: string }> = ({ title }) => (
  <Title>{title}</Title>
);

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
>({
  active,
  backdropHeight,
  componentType: Component,
  handleDismiss,
  marginLeft,
  suggestions: { data, onSelect },
  suggestionsTitle,
  width,
}: SuggestionsListProps<Co, Us>) => {
  const renderItem = ({ item }: { item: Suggestion<Co, Us> }) => {
    let render;

    if (isString(Component)) {
      switch (Component) {
        case 'MentionsItem':
          if (isSuggestionUser(item)) {
            render = <MentionsItem item={item} />;
          }
          break;
        case 'CommandsItem':
          if (!isSuggestionUser(item)) {
            render = <CommandsItem item={item} />;
          }
          break;
        default:
          return null;
      }
    } else {
      render = React.cloneElement(Component, { item });
    }

    return (
      <SuggestionsItem onPress={() => onSelect(item)}>{render}</SuggestionsItem>
    );
  };

  if (!active || !data || data.length === 0) return null;

  return (
    <Wrapper onPress={handleDismiss} style={{ height: backdropHeight }}>
      <Container length={data.length + 1} style={{ marginLeft, width }}>
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
      </Container>
    </Wrapper>
  );
};
