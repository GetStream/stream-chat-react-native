import React, { PropsWithChildren, useContext, useState } from 'react';
import type { CommandResponse, UserResponse } from 'stream-chat';

import { getDisplayName } from '../utils/getDisplayName';
import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type { AutoCompleteSuggestionItemProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { DefaultCommandType, DefaultUserType, UnknownType } from '../../types/types';
import type { Emoji } from '../../emoji-data/compiled';

export type SuggestionComponentType = 'command' | 'emoji' | 'mention';

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
> = Emoji | SuggestionCommand<Co> | SuggestionUser<Us>;

export type SuggestionCommand<Co extends string = DefaultCommandType> = CommandResponse<Co>;
export type SuggestionUser<Us extends UnknownType = DefaultUserType> = UserResponse<Us>;

export type Suggestions<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  data: Suggestion<Co, Us>[];
  onSelect: (item: Suggestion<Co, Us>) => void;
  queryText?: string;
};

export type SuggestionsContextValue<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType,
> = {
  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<AutoCompleteSuggestionItemProps<Co, Us>>;
  AutoCompleteSuggestionList: React.ComponentType<AutoCompleteSuggestionListProps<Co, Us>>;
  /** Override handler for closing suggestions (mentions, command autocomplete etc) */
  closeSuggestions: () => void;
  /**
   * Override handler for opening suggestions (mentions, command autocomplete etc)
   *
   * @param component {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  openSuggestions: (component: SuggestionComponentType) => Promise<void>;
  suggestions: Suggestions<Co, Us>;
  triggerType: SuggestionComponentType;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  updateSuggestions: (newSuggestions: Suggestions<Co, Us>) => void;
  queryText?: string;
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
  const [triggerType, setTriggerType] = useState<SuggestionComponentType | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions<Co, Us>>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = (component: SuggestionComponentType) => {
    setTriggerType(component);
    setSuggestionsViewActive(true);
  };

  const updateSuggestions = (newSuggestions: Suggestions<Co, Us>) => {
    setSuggestions(newSuggestions);
    setSuggestionsViewActive(!!triggerType);
  };

  const closeSuggestions = () => {
    setTriggerType(null);
    setSuggestions(undefined);
    setSuggestionsViewActive(false);
  };

  const suggestionsContext = {
    ...value,
    closeSuggestions,
    openSuggestions,
    suggestions,
    suggestionsViewActive,
    triggerType,
    updateSuggestions,
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
