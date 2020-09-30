import React, { PropsWithChildren, useContext, useRef, useState } from 'react';
import { findNodeHandle, View } from 'react-native';

import SuggestionsList from './SuggestionsList';

import { getDisplayName } from '../utils/getDisplayName';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type {
  DefaultCommandType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type SuggestionComponentType<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = string | React.ReactElement<{ item: Suggestion<Co, Us> }>;

export const isSuggestionUser = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>(
  suggestion: Suggestion<Co, Us>,
): suggestion is SuggestionUser<Us> => 'id' in suggestion;

export type Suggestion<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = SuggestionCommand<Co> | SuggestionUser<Us>;

export type SuggestionCommand<
  Co extends string = DefaultCommandType
> = CommandResponse<Co>;

export type SuggestionUser<
  Us extends UnknownType = DefaultUserType
> = UserResponse<Us>;

export type Suggestions<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = {
  data: Suggestion<Co, Us>[];
  onSelect: (item: Suggestion<Co, Us>) => void;
};

export type SuggestionsContextValue<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = {
  closeSuggestions: () => void;
  openSuggestions: (
    title: string,
    component: SuggestionComponentType<Co, Us>,
  ) => Promise<void>;
  setInputBoxContainerRef: (ref: View | null) => void;
  updateSuggestions: (newSuggestions: Suggestions<Co, Us>) => void;
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
export const SuggestionsProvider = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue<Co, Us>> }>) => {
  const [componentType, setComponentType] = useState<
    SuggestionComponentType<Co, Us>
  >('');
  const [suggestions, setSuggestions] = useState<Suggestions<Co, Us>>();
  const [suggestionsBackdropHeight, setSuggestionsBackdropHeight] = useState(0);
  const [suggestionsLeftMargin, setSuggestionsLeftMargin] = useState(0);
  const [suggestionsTitle, setSuggestionsTitle] = useState('');
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);
  const [suggestionsWidth, setSuggestionsWidth] = useState(0);

  const messageInputBox = useRef<View | null>(null);
  const rootView = useRef<View>(null);

  const openSuggestions = async (
    title: string,
    component: SuggestionComponentType<Co, Us>,
  ) => {
    const inputBoxPosition = await getInputBoxPosition();

    setComponentType(component);
    setSuggestionsBackdropHeight(inputBoxPosition.y);
    setSuggestionsLeftMargin(inputBoxPosition.x);
    setSuggestionsTitle(title);
    setSuggestionsViewActive(true);
    setSuggestionsWidth(inputBoxPosition.width);
  };

  const updateSuggestions = (newSuggestions: Suggestions<Co, Us>) => {
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
      messageInputBox?.current?.measureLayout(
        nodeHandleRoot,
        (x, y, width, height) => {
          resolve({ height, width, x, y });
        },
        () => resolve({ height: 0, width: 0, x: 0, y: 0 }),
      );
    });

  const suggestionsContext = {
    closeSuggestions: value?.closeSuggestions || closeSuggestions,
    openSuggestions: value?.openSuggestions || openSuggestions,
    setInputBoxContainerRef:
      value?.setInputBoxContainerRef || setInputBoxContainerRef,
    updateSuggestions: value?.updateSuggestions || updateSuggestions,
  };
  return (
    <SuggestionsContext.Provider
      value={(suggestionsContext as unknown) as SuggestionsContextValue}
    >
      {/** TODO: Support dynamic item view for different type of suggestions */}
      {suggestions && (
        <SuggestionsList<Co, Us>
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

export const useSuggestionsContext = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(SuggestionsContext) as unknown) as SuggestionsContextValue<
    Co,
    Us
  >;

export const withSuggestionsContext = <
  P extends UnknownType,
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof SuggestionsContextValue<Co, Us>>> => {
  const WithSuggestionsContextComponent = (
    props: Omit<P, keyof SuggestionsContextValue<Co, Us>>,
  ) => {
    const suggestionsContext = useSuggestionsContext<Co, Us>();

    return <Component {...(props as P)} {...suggestionsContext} />;
  };
  WithSuggestionsContextComponent.displayName = `WithSuggestionsContext${getDisplayName(
    Component,
  )}`;
  return WithSuggestionsContextComponent;
};
