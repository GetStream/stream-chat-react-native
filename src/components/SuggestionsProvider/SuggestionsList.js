import React from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { CommandsItem, MentionsItem } from '../AutoCompleteInput';

const Wrapper = styled.TouchableOpacity`
  height: ${({ height }) => height};
  position: absolute;
  width: 100%;
  z-index: 90;
  ${({ theme }) => theme.messageInput.suggestions.wrapper.css}
`;

const Container = styled.View`
  background-color: white;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  bottom: 10px;
  height: ${({ theme, length }) =>
    Math.min(
      length * theme.messageInput.suggestions.container.itemHeight,
      theme.messageInput.suggestions.container.maxHeight,
    )};
  margin-left: ${({ marginLeft }) => marginLeft};
  position: absolute;
  shadow-color: #000;
  shadow-offset: 0px -3px;
  shadow-opacity: 0.05;
  width: ${({ width }) => width};
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
  height: ${({ theme }) => theme.messageInput.suggestions.container.itemHeight};
  font-weight: bold;
  padding: 10px;
  ${({ theme }) => theme.messageInput.suggestions.title.css};
`;

const SuggestionsHeader = ({ title }) => <Title>{title}</Title>;
const SuggestionsSeparator = () => <Separator />;

const SuggestionsList = (props) => {
  const {
    active,
    backdropHeight,
    handleDismiss,
    marginLeft,
    suggestions: { data },
    suggestionsTitle,
    width,
  } = props;

  const renderItem = ({ item }) => {
    const {
      componentType,
      suggestions: { onSelect },
    } = props;

    switch (componentType) {
      case 'MentionsItem':
        return (
          <SuggestionsItem onPress={() => onSelect(item)}>
            <MentionsItem item={item} />
          </SuggestionsItem>
        );
      case 'CommandsItem':
        return (
          <SuggestionsItem onPress={() => onSelect(item)}>
            <CommandsItem item={item} />
          </SuggestionsItem>
        );
      default:
        return null;
    }
  };

  if (!active || !data || data.length === 0) return null;

  return (
    <Wrapper height={backdropHeight} onPress={handleDismiss}>
      <Container length={data.length + 1} marginLeft={marginLeft} width={width}>
        <FlatList
          data={data}
          ItemSeparatorComponent={SuggestionsSeparator}
          keyboardShouldPersistTaps='always'
          keyExtractor={(item, index) => (item.name || item.id) + index}
          ListHeaderComponent={<SuggestionsHeader title={suggestionsTitle} />}
          renderItem={renderItem}
        />
      </Container>
    </Wrapper>
  );
};

SuggestionsList.propTypes = {
  active: PropTypes.bool,
  backdropHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleDismiss: PropTypes.func,
  marginLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  suggestions: PropTypes.object,
  suggestionsTitle: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default SuggestionsList;
