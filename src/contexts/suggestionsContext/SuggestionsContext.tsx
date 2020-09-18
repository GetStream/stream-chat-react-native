import React, { useContext, useRef, useState } from 'react';
import { findNodeHandle, View } from 'react-native';

import type { Immutable } from 'seamless-immutable';
import type { CommandResponse, UnknownType, UserResponse } from 'stream-chat';

import SuggestionsList from './SuggestionsList';

import { getDisplayName } from '../utils/getDisplayName';

import type { DefaultCommandType, DefaultUserType } from '../../types/types';

export const isSuggestionUser = (
  suggestion: Suggestion,
): suggestion is SuggestionUser => 'id' in suggestion;

export type Suggestion = SuggestionCommand | SuggestionUser;

export type SuggestionCommand<
  Co extends string = DefaultCommandType
> = CommandResponse<Co>;

export type SuggestionUser<Us extends UnknownType = DefaultUserType> =
  | UserResponse<Us>
  | Immutable<UserResponse<Us>>
  | Immutable<Immutable<UserResponse<Us>>>;

export type Suggestions = {
  data: Suggestion[];
  onSelect: (item: Suggestion) => void;
};

export type SuggestionsContextValue = {
  closeSuggestions: () => void;
  openSuggestions: (
    title: string,
    component: string | React.ReactElement<{ item: Suggestion }>,
  ) => void;
  setInputBoxContainerRef: (ref: View) => void;
  updateSuggestions: (newSuggestions: Suggestions) => void;
};

export const SuggestionsContext = React.createContext(
  {} as SuggestionsContextValue,
);

type MeasureLayout = () => Promise<{
  height: number;
  width: number;
  x: number;
  y: number;
}>;

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider: React.FC<{
  value: SuggestionsContextValue;
}> = ({ children, value }) => {
  const [componentType, setComponentType] = useState<
    string | React.ReactElement<{ item: Suggestion }>
  >('');
  const [suggestions, setSuggestions] = useState<Suggestions>();
  const [suggestionsBackdropHeight, setSuggestionsBackdropHeight] = useState(0);
  const [suggestionsLeftMargin, setSuggestionsLeftMargin] = useState(0);
  const [suggestionsTitle, setSuggestionsTitle] = useState('');
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);
  const [suggestionsWidth, setSuggestionsWidth] = useState(0);

  const messageInputBox = useRef<View | null>(null);
  const rootView = useRef<View>(null);

  const openSuggestions = async (
    title: string,
    component: string | React.ReactElement<{ item: Suggestion }>,
  ) => {
    const inputBoxPosition = await getInputBoxPosition();

    setComponentType(component);
    setSuggestionsBackdropHeight(inputBoxPosition.y);
    setSuggestionsLeftMargin(inputBoxPosition.x);
    setSuggestionsTitle(title);
    setSuggestionsViewActive(true);
    setSuggestionsWidth(inputBoxPosition.width);
  };

  const updateSuggestions = (newSuggestions: Suggestions) => {
    setSuggestions(newSuggestions);
    setSuggestionsViewActive(!!componentType);
  };

  const closeSuggestions = () => {
    setComponentType('');
    setSuggestionsTitle('');
    setSuggestionsViewActive(false);
  };

  const setInputBoxContainerRef = (ref: View) => {
    messageInputBox.current = ref;
  };

  const getInputBoxPosition: MeasureLayout = () =>
    new Promise((resolve) => {
      const nodeHandleRoot = findNodeHandle(rootView.current) || 0;
      messageInputBox.current &&
        messageInputBox.current.measureLayout(
          nodeHandleRoot,
          (x, y, width, height) => {
            resolve({ height, width, x, y });
          },
          () => resolve({ height: 0, width: 0, x: 0, y: 0 }),
        );
    });

  const suggestionsContext = {
    closeSuggestions: (value && value.closeSuggestions) || closeSuggestions,
    openSuggestions: (value && value.openSuggestions) || openSuggestions,
    setInputBoxContainerRef:
      (value && value.setInputBoxContainerRef) || setInputBoxContainerRef,
    updateSuggestions: (value && value.updateSuggestions) || updateSuggestions,
  };
  return (
    <SuggestionsContext.Provider value={suggestionsContext}>
      {/** TODO: Support dynamic item view for different type of suggestions */}
      {suggestions && (
        <SuggestionsList
          active={suggestionsViewActive}
          backdropHeight={suggestionsBackdropHeight}
          componentType={componentType}
          handleDismiss={() => setSuggestionsViewActive(false)}
          marginLeft={suggestionsLeftMargin}
          suggestions={suggestions}
          suggestionsTitle={suggestionsTitle}
          width={suggestionsWidth}
        />
      )}
      <View collapsable={false} ref={rootView} style={{ height: '100%' }}>
        {children}
      </View>
    </SuggestionsContext.Provider>
  );
};

export const useSuggestionsContext = () => useContext(SuggestionsContext);

export const withSuggestionsContext = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof SuggestionsContextValue>> => {
  const WithSuggestionsContextComponent = (
    props: Omit<P, keyof SuggestionsContextValue>,
  ) => {
    const suggestionsContext = useSuggestionsContext();

    return <Component {...(props as P)} {...suggestionsContext} />;
  };
  WithSuggestionsContextComponent.displayName = `WithSuggestionsContext${getDisplayName(
    Component,
  )}`;
  return WithSuggestionsContextComponent;
};
