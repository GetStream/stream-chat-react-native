import React from 'react';
import { View, FlatList, findNodeHandle } from 'react-native';

import { SuggestionsContext } from '../context';

import styled from 'styled-components';
import { getTheme } from '../styles/theme';

const Wrapper = styled.TouchableOpacity`
  position: ${(props) => getTheme(props).suggestionsProvider.wrapper.position};
  z-index: ${(props) => getTheme(props).suggestionsProvider.wrapper.zIndex};
  height: ${(props) => props.height};
  width: ${(props) => getTheme(props).suggestionsProvider.wrapper.width};
`;

const Container = styled.View`
  position: ${(props) =>
    getTheme(props).suggestionsProvider.container.position};
  bottom: ${(props) => getTheme(props).suggestionsProvider.container.bottom};
  background-color: ${(props) =>
    getTheme(props).suggestionsProvider.container.backgroundColor};
  z-index: ${(props) => getTheme(props).suggestionsProvider.container.zIndex};
  border-top-left-radius: ${(props) =>
    getTheme(props).suggestionsProvider.container.borderTopLeftRadius};
  border-top-right-radius: ${(props) =>
    getTheme(props).suggestionsProvider.container.borderTopRightRadius};
  width: ${(props) => props.width};
  margin-left: ${(props) => props.marginLeft};
  shadow-color: ${(props) =>
    getTheme(props).suggestionsProvider.container.shadowColor};
  shadow-opacity: ${(props) =>
    getTheme(props).suggestionsProvider.container.shadowOpacity}
  shadow-offset: ${(props) =>
    getTheme(props).suggestionsProvider.container.shadowOffset}
  height: ${(props) =>
    Math.min(
      props.length * getTheme(props).suggestionsProvider.container.itemHeight,
      getTheme(props).suggestionsProvider.container.maxHeight,
    )};
`;

const Title = styled.Text`
  padding: ${(props) => getTheme(props).suggestionsHeader.title.padding}px;
  font-weight: ${(props) => getTheme(props).suggestionsHeader.title.fontWeight};
  height: ${(props) =>
    getTheme(props).suggestionsProvider.container.itemHeight};
`;

const Separator = styled.View`
  height: ${(props) => getTheme(props).suggestionsSeparator.separator.height};
`;

const SuggestionsItem = styled.TouchableOpacity`
  justify-content: ${(props) => getTheme(props).suggestionsItem.justifyContent};
  height: ${(props) =>
    getTheme(props).suggestionsProvider.container.itemHeight};
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
