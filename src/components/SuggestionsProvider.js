import React from 'react';
import { View, FlatList, findNodeHandle } from 'react-native';

import { SuggestionsContext } from '../context';

import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.TouchableOpacity`
  position: absolute;
  z-index: 90;
  height: ${({ height }) => height};
  width: 100%;
  ${({ theme }) => theme.messageInput.suggestions.wrapper.css}
`;

const Container = styled.View`
  position: absolute;
  bottom: 10;
  background-color: white;
  z-index: 100;
  border-top-left-radius: 10;
  border-top-right-radius: 10;
  width: ${({ width }) => width};
  margin-left: ${({ marginLeft }) => marginLeft};
  shadow-color: #000;
  shadow-opacity: 0.05;
  shadow-offset: 0px -3px;
  height: ${({ theme, length }) =>
    Math.min(
      length * theme.messageInput.suggestions.container.itemHeight,
      theme.messageInput.suggestions.container.maxHeight,
    )};
  ${({ theme }) => theme.messageInput.suggestions.container.css};
`;

const Title = styled.Text`
  padding: 10px;
  font-weight: bold;
  height: ${({ theme }) => theme.messageInput.suggestions.container.itemHeight};
  ${({ theme }) => theme.messageInput.suggestions.title.css};
`;

const Separator = styled.View`
  height: 0;
  ${({ theme }) => theme.messageInput.suggestions.separator.css};
`;

const SuggestionsItem = styled.TouchableOpacity`
  justify-content: center;
  height: ${({ theme }) => theme.messageInput.suggestions.container.itemHeight};
  ${({ theme }) => theme.messageInput.suggestions.item.css};
`;

export class SuggestionsProvider extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      suggestionsViewActive: false,
      suggestionsBottomMargin: 0,
      suggestionsLeftMargin: 0,
      suggestions: [],
      suggestionsWidth: 0,
      suggestionsBackdropHeight: 0,
      suggestionsTitle: '',
      component: null,
    };
  }

  openSuggestions = async (title, component) => {
    const [inputBoxPosition, chatBoxPosition] = await Promise.all([
      this.getInputBoxPosition(),
      this.getChatBoxPosition(),
    ]);

    this.setState({
      suggestionsBottomMargin: chatBoxPosition.height - inputBoxPosition.y,
      suggestionsLeftMargin: inputBoxPosition.x,
      suggestionsWidth: inputBoxPosition.width,
      suggestionsViewActive: true,
      suggestionsBackdropHeight: inputBoxPosition.y,
      suggestionsTitle: title,
      component,
    });
  };

  updateSuggestions = (suggestions) => {
    this.setState({
      suggestions,
    });
  };

  closeSuggestions = () => {
    this.setState({
      suggestionsViewActive: false,
      suggestionsTitle: '',
      component: null,
    });
  };

  setInputBoxContainerRef = (o) => {
    this.messageInputBox = o;
  };

  getInputBoxPosition = () =>
    new Promise((resolve) => {
      const nodeHandleRoot = findNodeHandle(this.rootView);
      this.messageInputBox.measureLayout(
        nodeHandleRoot,
        (x, y, width, height) => {
          resolve({ x, y, height, width });
        },
      );
    });

  getChatBoxPosition = () =>
    new Promise((resolve) => {
      const nodeHandleRoot = findNodeHandle(this.rootView);
      this.rootView.measureLayout(nodeHandleRoot, (x, y, width, height) => {
        resolve({ x, y, height, width });
      });
    });

  setRootView = (o) => {
    this.rootView = o;
  };

  getContext = () => ({
    setInputBoxContainerRef: this.setInputBoxContainerRef,
    openSuggestions: this.openSuggestions,
    closeSuggestions: this.closeSuggestions,
    updateSuggestions: this.updateSuggestions,
  });

  render() {
    return (
      <SuggestionsContext.Provider value={this.getContext()}>
        {/** TODO: Support dynamic item view for different type of suggestions */}
        <SuggestionsView
          component={this.state.component}
          suggestions={this.state.suggestions}
          active={this.state.suggestionsViewActive}
          marginBottom={this.state.suggestionsBottomMargin}
          marginLeft={this.state.suggestionsLeftMargin}
          width={this.state.suggestionsWidth}
          backdropHeight={this.state.suggestionsBackdropHeight}
          handleDismiss={this.closeSuggestions}
          suggestionsTitle={this.state.suggestionsTitle}
        />
        <View
          ref={this.setRootView}
          collapsable={false}
          style={{ height: '100%' }}
        >
          {this.props.children}
        </View>
      </SuggestionsContext.Provider>
    );
  }
}

class SuggestionsView extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    active: PropTypes.bool,
    marginLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    suggestions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    backdropHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    handleDismiss: PropTypes.func,
    suggestionsTitle: PropTypes.string,
  };
  renderHeader = () => <SuggestionsHeader />;
  renderItem = ({ item }) => {
    const {
      suggestions: { onSelect },
      component: Component,
    } = this.props;

    return (
      <SuggestionsItem
        onPress={() => {
          onSelect(item);
        }}
      >
        <Component item={item} />
      </SuggestionsItem>
    );
  };

  render() {
    const {
      active,
      marginLeft,
      width,
      suggestions: { data },
      backdropHeight,
      handleDismiss,
      suggestionsTitle,
    } = this.props;

    if (!active) return null;
    if (!data || data.length === 0) return null;
    return (
      <Wrapper height={backdropHeight} onPress={handleDismiss}>
        <Container
          width={width}
          length={data.length + 1}
          marginLeft={marginLeft}
        >
          <FlatList
            ListHeaderComponent={<SuggestionsHeader title={suggestionsTitle} />}
            ItemSeparatorComponent={SuggestionsSeparator}
            data={data}
            keyboardShouldPersistTaps="always"
            renderItem={this.renderItem}
            keyExtractor={(item, index) => (item.name || item.id) + index}
          />
        </Container>
      </Wrapper>
    );
  }
}

const SuggestionsHeader = ({ title }) => <Title>{title}</Title>;

const SuggestionsSeparator = () => <Separator />;
