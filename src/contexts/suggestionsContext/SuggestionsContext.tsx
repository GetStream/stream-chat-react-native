import React, { PropsWithChildren, useContext, useState } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type { Emoji } from '../../emoji-data/compiled';
import type { DefaultCommandType, DefaultUserType, UnknownType } from '../../types/types';

export type SuggestionComponentType<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = string | React.ReactElement<{ item: Suggestion<Co, Us> }>;

export const isSuggestionCommand = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>(
  suggestion: Suggestion<Co, Us>,
): suggestion is SuggestionCommand<Co> => 'args' in suggestion;

export const isSuggestionEmoji = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>(
  suggestion: Suggestion<Co, Us>,
): suggestion is Emoji => 'unicode' in suggestion;

export const isSuggestionUser = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>(
  suggestion: Suggestion<Co, Us>,
): suggestion is SuggestionUser<Us> => 'id' in suggestion;

export type Suggestion<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = SuggestionCommand<Co> | SuggestionUser<Us> | Emoji;

export type SuggestionCommand<Co extends string = DefaultCommandType> = CommandResponse<Co>;

export type SuggestionUser<Us extends UnknownType = DefaultUserType> = UserResponse<Us>;

export type Suggestions<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  data: Suggestion<Co, Us>[];
  onSelect: (item: Suggestion<Co, Us>) => void;
};

export type SuggestionsContextValue<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  /** Override handler for closing suggestions (mentions, command autocomplete etc) */
  closeSuggestions: () => void;
  /**
   * Override handler for opening suggestions (mentions, command autocomplete etc)
   *
   * @param component {Component|element} UI Component for suggestion item.
   * @param title {string} Title for suggestions box
   *
   * @overrideType Function
   */
  openSuggestions: (
    component: SuggestionComponentType<Co, Us>,
    title?: React.ReactElement,
  ) => Promise<void>;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @param newSuggestionsTitle {string} Title for suggestions box
   *
   * @overrideType Function
   */
  updateSuggestions: (
    newSuggestions: Suggestions<Co, Us>,
    newSuggestionsTitle?: React.ReactElement,
  ) => void;
  componentType?: SuggestionComponentType<Co, Us>;
  suggestions?: Suggestions<Co, Us>;
  suggestionsTitle?: React.ReactElement;
  suggestionsViewActive?: boolean;
};

export const SuggestionsContext = React.createContext({} as SuggestionsContextValue);

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue<Co, Us>> }>) => {
  const [componentType, setComponentType] = useState<SuggestionComponentType<Co, Us>>('');
  const [suggestions, setSuggestions] = useState<Suggestions<Co, Us>>();
  const [suggestionsTitle, setSuggestionsTitle] = useState<React.ReactElement>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = (
    component: SuggestionComponentType<Co, Us>,
    title?: React.ReactElement,
  ) => {
    setComponentType(component);
    setSuggestionsTitle(title);
    setSuggestionsViewActive(true);
  };

  const updateSuggestions = (
    newSuggestions: Suggestions<Co, Us>,
    newSuggestionsTitle?: React.ReactElement,
  ) => {
    setSuggestions(newSuggestions);
    if (newSuggestionsTitle) {
      setSuggestionsTitle(newSuggestionsTitle);
    }
    setSuggestionsViewActive(!!componentType);
  };

  const closeSuggestions = () => {
    setComponentType('');
    setSuggestions(undefined);
    setSuggestionsTitle(undefined);
    setSuggestionsViewActive(false);
  };

  const suggestionsContext = {
    closeSuggestions: value?.closeSuggestions || closeSuggestions,
    componentType,
    openSuggestions: value?.openSuggestions || openSuggestions,
    suggestions,
    suggestionsTitle,
    suggestionsViewActive,
    updateSuggestions: value?.updateSuggestions || updateSuggestions,
  };

  return (
    <SuggestionsContext.Provider value={suggestionsContext as unknown as SuggestionsContextValue}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestionsContext = <
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
>() => useContext(SuggestionsContext) as unknown as SuggestionsContextValue<Co, Us>;

export const withSuggestionsContext = <
  P extends UnknownType,
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
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
