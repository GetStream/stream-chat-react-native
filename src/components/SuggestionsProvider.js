import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  findNodeHandle,
  TouchableHighlight,
} from 'react-native';

import { Avatar } from './Avatar';
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
      SuggestionsViewItem: null,
    };
  }

  openSuggestions = async () => {
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
          ItemView={MentionsItem}
          suggestions={this.state.suggestions}
          active={this.state.suggestionsViewActive}
          marginBottom={this.state.suggestionsBottomMargin}
          marginLeft={this.state.suggestionsLeftMargin}
          width={this.state.suggestionsWidth}
          backdropHeight={this.state.suggestionsBackdropHeight}
          handleDismiss={this.closeSuggestions}
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

  render() {
    const {
      active,
      marginLeft,
      width,
      suggestions: { data, onSelect },
      ItemView,
      backdropHeight,
      handleDismiss,
    } = this.props;
    if (!active) return null;

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
            ListHeaderComponent={SuggestionsHeader}
            ItemSeparatorComponent={SuggestionsSeparator}
            data={data}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableHighlight
                underlayColor="blue"
                style={{
                  height: SUGGESTIONS_ITEM_HEIGHT,
                  justifyContent: 'center',
                }}
                onPress={() => {
                  onSelect(item);
                }}
              >
                <ItemView name={item.name} icon={item.image} />
              </TouchableHighlight>
            )}
            keyExtractor={(item, index) => item.name + index}
          />
        </View>
      </TouchableOpacity>
    );
  }
}

const SuggestionsHeader = () => (
  <Text style={{ padding: 10, height: SUGGESTIONS_ITEM_HEIGHT }}>
    Searching for people
  </Text>
);

const SuggestionsSeparator = () => <View style={{ height: 0 }} />;

class MentionsItem extends React.PureComponent {
  render() {
    const { name, icon } = this.props;
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar image={icon} />
        <Text style={{ padding: 10 }}>{name}</Text>
      </View>
    );
  }
}
const SUGGESTIONS_ITEM_HEIGHT = 50;
