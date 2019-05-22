import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  findNodeHandle,
} from 'react-native';

import { SuggestionsContext } from '../context';

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
        <View ref={this.setRootView} collapsable={false}>
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
      <TouchableOpacity
        style={{
          height: SUGGESTIONS_ITEM_HEIGHT,
          justifyContent: 'center',
        }}
        onPress={() => {
          onSelect(item);
        }}
      >
        <Component item={item} />
      </TouchableOpacity>
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
      <TouchableOpacity
        style={{
          position: 'absolute',
          zIndex: 90,
          height: backdropHeight,
          width: '100%',
        }}
        onPress={handleDismiss}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            marginLeft,
            width,
            height: Math.min((data.length + 1) * SUGGESTIONS_ITEM_HEIGHT, 250),
            backgroundColor: 'white',
            shadowColor: '#EBEBEB',
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: -3 },
            zIndex: 100,
          }}
        >
          <FlatList
            ListHeaderComponent={<SuggestionsHeader title={suggestionsTitle} />}
            ItemSeparatorComponent={SuggestionsSeparator}
            data={data}
            keyboardShouldPersistTaps="always"
            renderItem={this.renderItem}
            keyExtractor={(item, index) => (item.name || item.id) + index}
          />
        </View>
      </TouchableOpacity>
    );
  }
}

const SuggestionsHeader = ({ title }) => (
  <Text
    style={{ padding: 10, height: SUGGESTIONS_ITEM_HEIGHT, fontWeight: 'bold' }}
  >
    {title}
  </Text>
);

const SuggestionsSeparator = () => <View style={{ height: 0 }} />;

const SUGGESTIONS_ITEM_HEIGHT = 50;
