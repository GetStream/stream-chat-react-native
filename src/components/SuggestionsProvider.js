import React from 'react';
import { View, FlatList, findNodeHandle } from 'react-native';

import { SuggestionsContext } from '../context';

import styled from '@stream-io/styled-components';

const Wrapper = styled.TouchableOpacity`
  position: ${({ theme }) => theme.suggestionsProvider.wrapper.position};
  z-index: ${({ theme }) => theme.suggestionsProvider.wrapper.zIndex};
  height: ${({ height }) => height};
  width: ${({ theme }) => theme.suggestionsProvider.wrapper.width};
`;

const Container = styled.View`
  position: ${({ theme }) => theme.suggestionsProvider.container.position};
  bottom: ${({ theme }) => theme.suggestionsProvider.container.bottom};
  background-color: ${({ theme }) =>
    theme.suggestionsProvider.container.backgroundColor};
  z-index: ${({ theme }) => theme.suggestionsProvider.container.zIndex};
  border-top-left-radius: ${({ theme }) =>
    theme.suggestionsProvider.container.borderTopLeftRadius};
  border-top-right-radius: ${({ theme }) =>
    theme.suggestionsProvider.container.borderTopRightRadius};
  width: ${({ width }) => width};
  margin-left: ${({ marginLeft }) => marginLeft};
  shadow-color: ${({ theme }) =>
    theme.suggestionsProvider.container.shadowColor};
  shadow-opacity: ${({ theme }) =>
    theme.suggestionsProvider.container.shadowOpacity}
  shadow-offset: ${({ theme }) =>
    theme.suggestionsProvider.container.shadowOffset}
  height: ${({ theme, length }) =>
    Math.min(
      length * theme.suggestionsProvider.container.itemHeight,
      theme.suggestionsProvider.container.maxHeight,
    )};
`;

const Title = styled.Text`
  padding: ${({ theme }) => theme.suggestionsHeader.title.padding}px;
  font-weight: ${({ theme }) => theme.suggestionsHeader.title.fontWeight};
  height: ${({ theme }) => theme.suggestionsProvider.container.itemHeight};
`;

const Separator = styled.View`
  height: ${({ theme }) => theme.suggestionsSeparator.separator.height};
`;

const SuggestionsItem = styled.TouchableOpacity`
  justify-content: ${({ theme }) => theme.suggestionsItem.justifyContent};
  height: ${({ theme }) => theme.suggestionsProvider.container.itemHeight};
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
