import React, { PropsWithChildren, useContext, useState } from 'react';
import type { CommandResponse, UserResponse } from 'stream-chat';

import type { Emoji } from '../../emoji-data/compiled';
import { getDisplayName } from '../utils/getDisplayName';
import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type {
  AutoCompleteSuggestionItemProps,
  CommandItemType,
  EmojiItemType,
} from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { DefaultCommandType, DefaultUserType, UnknownType } from '../../types/types';

export type SuggestionComponentType = string;

export const isSuggestionCommand = <Us extends UnknownType = DefaultUserType>(
  suggestion: Suggestion<Us>,
): suggestion is CommandItemType => 'args' in suggestion;

export const isSuggestionEmoji = <Us extends UnknownType = DefaultUserType>(
  suggestion: Suggestion<Us>,
): suggestion is EmojiItemType => 'unicode' in suggestion;

export const isSuggestionUser = <Us extends UnknownType = DefaultUserType>(
  suggestion: Suggestion<Us>,
): suggestion is SuggestionUser<Us> => 'id' in suggestion;

export type Suggestion<Us extends UnknownType = DefaultUserType> =
  | Emoji
  | CommandItemType
  | SuggestionUser<Us>;

export type SuggestionCommand<Co extends string = DefaultCommandType> = CommandResponse<Co>;
export type SuggestionUser<Us extends UnknownType = DefaultUserType> = UserResponse<Us>;

export type Suggestions<Us extends UnknownType = DefaultUserType> = {
  data: Suggestion<Us>[];
  onSelect: (item: Suggestion<Us>) => void;
  query?: string;
};

export type SuggestionsContextValue<Us extends UnknownType = DefaultUserType> = {
  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<AutoCompleteSuggestionItemProps<Us>>;
  AutoCompleteSuggestionList: React.ComponentType<AutoCompleteSuggestionListProps<Us>>;
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
  openSuggestions: (component: SuggestionComponentType) => Promise<void>;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @param newSuggestionsTitle {string} Title for suggestions box
   *
   * @overrideType Function
   */
  updateSuggestions: (newSuggestions: Suggestions<Us>) => void;
  componentType?: SuggestionComponentType;
  suggestions?: Suggestions<Us>;
  suggestionsViewActive?: boolean;
};

export const SuggestionsContext = React.createContext({} as SuggestionsContextValue);

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider = <Us extends UnknownType = DefaultUserType>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue<Us>> }>) => {
  const [componentType, setComponentType] = useState<SuggestionComponentType>('');
  const [suggestions, setSuggestions] = useState<Suggestions<Us>>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = (component: SuggestionComponentType) => {
    setComponentType(component);
    setSuggestionsViewActive(true);
  };

  const updateSuggestions = (newSuggestions: Suggestions<Us>) => {
    setSuggestions(newSuggestions);
    setSuggestionsViewActive(!!componentType);
  };

  const closeSuggestions = () => {
    setComponentType('');
    setSuggestions(undefined);
    setSuggestionsViewActive(false);
  };

  const suggestionsContext = {
    AutoCompleteSuggestionHeader: value?.AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem: value?.AutoCompleteSuggestionItem,
    AutoCompleteSuggestionList: value?.AutoCompleteSuggestionList,
    closeSuggestions: value?.closeSuggestions || closeSuggestions,
    componentType,
    openSuggestions: value?.openSuggestions || openSuggestions,
    suggestions,
    suggestionsViewActive,
    updateSuggestions: value?.updateSuggestions || updateSuggestions,
  };

  return (
    <SuggestionsContext.Provider value={suggestionsContext as unknown as SuggestionsContextValue}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestionsContext = <Us extends UnknownType = DefaultUserType>() =>
  useContext(SuggestionsContext) as unknown as SuggestionsContextValue<Us>;

export const withSuggestionsContext = <
  P extends UnknownType,
  Us extends UnknownType = DefaultUserType,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof SuggestionsContextValue<Us>>> => {
  const WithSuggestionsContextComponent = (props: Omit<P, keyof SuggestionsContextValue<Us>>) => {
    const suggestionsContext = useSuggestionsContext<Us>();

    return <Component {...(props as P)} {...suggestionsContext} />;
  };
  WithSuggestionsContextComponent.displayName = `WithSuggestionsContext${getDisplayName(
    Component,
  )}`;
  return WithSuggestionsContextComponent;
};
