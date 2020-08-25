import React, { useRef, useState } from 'react';
import { findNodeHandle, View } from 'react-native';

import { SuggestionsContext } from '../../context';
import SuggestionsList from './SuggestionsList';

/**
 *
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
const SuggestionsProvider = ({ children }) => {
  const [componentType, setComponentType] = useState('');
  const [suggestions, setSuggestions] = useState({});
  const [suggestionsBackdropHeight, setSuggestionsBackdropHeight] = useState(0);
  const [suggestionsBottomMargin, setSuggestionsBottomMargin] = useState(0);
  const [suggestionsLeftMargin, setSuggestionsLeftMargin] = useState(0);
  const [suggestionsTitle, setSuggestionsTitle] = useState('');
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);
  const [suggestionsWidth, setSuggestionsWidth] = useState(0);

  const messageInputBox = useRef();
  const rootView = useRef();

  const openSuggestions = async (title, component) => {
    const [chatBoxPosition, inputBoxPosition] = await Promise.all([
      getChatBoxPosition(),
      getInputBoxPosition(),
    ]);

    setComponentType(component);
    setSuggestionsBackdropHeight(inputBoxPosition.y);
    setSuggestionsBottomMargin(chatBoxPosition.height - inputBoxPosition.y);
    setSuggestionsLeftMargin(inputBoxPosition.x);
    setSuggestionsTitle(title);
    setSuggestionsViewActive(true);
    setSuggestionsWidth(inputBoxPosition.width);
  };

  const updateSuggestions = (suggestions) => {
    setSuggestions(suggestions);
    setSuggestionsViewActive(!!componentType);
  };

  const closeSuggestions = () => {
    setComponentType('');
    setSuggestionsTitle('');
    setSuggestionsViewActive(false);
  };

  const setInputBoxContainerRef = (o) => {
    messageInputBox.current = o;
  };

  const getInputBoxPosition = () =>
    new Promise((resolve) => {
      const nodeHandleRoot = findNodeHandle(rootView.current);
      messageInputBox.current &&
        messageInputBox.current.measureLayout(
          nodeHandleRoot,
          (x, y, width, height) => {
            resolve({ x, y, height, width });
          },
        );
    });

  const getChatBoxPosition = () =>
    new Promise((resolve) => {
      const nodeHandleRoot = findNodeHandle(rootView.current);
      rootView.current &&
        rootView.current.measureLayout(
          nodeHandleRoot,
          (x, y, width, height) => {
            resolve({ x, y, height, width });
          },
        );
    });

  const suggestionsContext = {
    closeSuggestions,
    openSuggestions,
    setInputBoxContainerRef,
    updateSuggestions,
  };

  return (
    <SuggestionsContext.Provider value={suggestionsContext}>
      {/** TODO: Support dynamic item view for different type of suggestions */}
      <SuggestionsList
        active={suggestionsViewActive}
        backdropHeight={suggestionsBackdropHeight}
        componentType={componentType}
        handleDismiss={() => setSuggestionsViewActive(false)}
        marginBottom={suggestionsBottomMargin}
        marginLeft={suggestionsLeftMargin}
        suggestions={suggestions}
        suggestionsTitle={suggestionsTitle}
        width={suggestionsWidth}
      />
      <View collapsable={false} ref={rootView} style={{ height: '100%' }}>
        {children}
      </View>
    </SuggestionsContext.Provider>
  );
};

export default SuggestionsProvider;
