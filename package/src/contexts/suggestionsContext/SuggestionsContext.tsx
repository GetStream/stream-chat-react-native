import React, { PropsWithChildren, useContext, useState } from 'react';

import type { CommandResponse, ExtendableGenerics, UserResponse } from 'stream-chat';

import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type { Emoji } from '../../emoji-data/compiled';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type SuggestionComponentType = 'command' | 'emoji' | 'mention';

export const isSuggestionCommand = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatClient>,
): suggestion is SuggestionCommand<StreamChatClient> => 'args' in suggestion;

export const isSuggestionEmoji = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatClient>,
): suggestion is Emoji => 'unicode' in suggestion;

export const isSuggestionUser = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatClient>,
): suggestion is SuggestionUser<StreamChatClient> => 'id' in suggestion;

export type Suggestion<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> =
  | Emoji
  | SuggestionCommand<StreamChatClient>
  | SuggestionUser<StreamChatClient>;

export type SuggestionCommand<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = CommandResponse<StreamChatClient>;
export type SuggestionUser<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = UserResponse<StreamChatClient>;

export type Suggestions<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  data: Suggestion<StreamChatClient>[];
  onSelect: (item: Suggestion<StreamChatClient>) => void;
  queryText?: string;
};

export type SuggestionsContextValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<
    AutoCompleteSuggestionItemProps<StreamChatClient>
  >;
  AutoCompleteSuggestionList: React.ComponentType<
    AutoCompleteSuggestionListProps<StreamChatClient>
  >;
  /** Override handler for closing suggestions (mentions, command autocomplete etc) */
  closeSuggestions: () => void;
  /**
   * Override handler for opening suggestions (mentions, command autocomplete etc)
   *
   * @param component {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  openSuggestions: (component: SuggestionComponentType) => Promise<void>;
  suggestions: Suggestions<StreamChatClient>;
  triggerType: SuggestionComponentType;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  updateSuggestions: (newSuggestions: Suggestions<StreamChatClient>) => void;
  queryText?: string;
  suggestionsViewActive?: boolean;
};

export const SuggestionsContext = React.createContext({} as SuggestionsContextValue);

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue<StreamChatClient>> }>) => {
  const [triggerType, setTriggerType] = useState<SuggestionComponentType | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions<StreamChatClient>>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = (component: SuggestionComponentType) => {
    setTriggerType(component);
    setSuggestionsViewActive(true);
  };

  const updateSuggestions = (newSuggestions: Suggestions<StreamChatClient>) => {
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
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => useContext(SuggestionsContext) as unknown as SuggestionsContextValue<StreamChatClient>;

export const withSuggestionsContext = <
  P extends UnknownType,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof SuggestionsContextValue<StreamChatClient>>> => {
  const WithSuggestionsContextComponent = (
    props: Omit<P, keyof SuggestionsContextValue<StreamChatClient>>,
  ) => {
    const suggestionsContext = useSuggestionsContext<StreamChatClient>();

    return <Component {...(props as P)} {...suggestionsContext} />;
  };
  WithSuggestionsContextComponent.displayName = `WithSuggestionsContext${getDisplayName(
    Component,
  )}`;
  return WithSuggestionsContextComponent;
};
