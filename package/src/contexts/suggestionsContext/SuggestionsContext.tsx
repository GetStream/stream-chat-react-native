import React, { PropsWithChildren, useContext, useState } from 'react';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type { Emoji } from '../../emoji-data/compiled';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type SuggestionComponentType = 'command' | 'emoji' | 'mention';

export const isSuggestionCommand = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatGenerics>,
): suggestion is SuggestionCommand<StreamChatGenerics> => 'args' in suggestion;

export const isSuggestionEmoji = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatGenerics>,
): suggestion is Emoji => 'unicode' in suggestion;

export const isSuggestionUser = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  suggestion: Suggestion<StreamChatGenerics>,
): suggestion is SuggestionUser<StreamChatGenerics> => 'id' in suggestion;

export type Suggestion<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Emoji | SuggestionCommand<StreamChatGenerics> | SuggestionUser<StreamChatGenerics>;

export type SuggestionCommand<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = CommandResponse<StreamChatGenerics>;
export type SuggestionUser<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = UserResponse<StreamChatGenerics>;

export type Suggestions<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  data: Suggestion<StreamChatGenerics>[];
  onSelect: (item: Suggestion<StreamChatGenerics>) => void;
  queryText?: string;
};

export type SuggestionsContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<
    AutoCompleteSuggestionItemProps<StreamChatGenerics>
  >;
  AutoCompleteSuggestionList: React.ComponentType<
    AutoCompleteSuggestionListProps<StreamChatGenerics>
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
  suggestions: Suggestions<StreamChatGenerics>;
  triggerType: SuggestionComponentType;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  updateSuggestions: (newSuggestions: Suggestions<StreamChatGenerics>) => void;
  queryText?: string;
  suggestionsViewActive?: boolean;
};

export const SuggestionsContext = React.createContext({} as SuggestionsContextValue);

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue<StreamChatGenerics>> }>) => {
  const [triggerType, setTriggerType] = useState<SuggestionComponentType | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions<StreamChatGenerics>>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = (component: SuggestionComponentType) => {
    setTriggerType(component);
    setSuggestionsViewActive(true);
  };

  const updateSuggestions = (newSuggestions: Suggestions<StreamChatGenerics>) => {
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => useContext(SuggestionsContext) as unknown as SuggestionsContextValue<StreamChatGenerics>;

export const withSuggestionsContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof SuggestionsContextValue<StreamChatGenerics>>> => {
  const WithSuggestionsContextComponent = (
    props: Omit<P, keyof SuggestionsContextValue<StreamChatGenerics>>,
  ) => {
    const suggestionsContext = useSuggestionsContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...suggestionsContext} />;
  };
  WithSuggestionsContextComponent.displayName = `WithSuggestionsContext${getDisplayName(
    Component,
  )}`;
  return WithSuggestionsContextComponent;
};
