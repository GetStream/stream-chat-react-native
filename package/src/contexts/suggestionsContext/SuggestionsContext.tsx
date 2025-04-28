import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

import type { CommandResponse, UserResponse } from 'stream-chat';

import type { AutoCompleteSuggestionHeaderProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionHeader';
import type { AutoCompleteSuggestionItemProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionItem';
import type { AutoCompleteSuggestionListProps } from '../../components/AutoCompleteInput/AutoCompleteSuggestionList';
import type { Emoji } from '../../emoji-data';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type SuggestionComponentType = 'command' | 'emoji' | 'mention';

export const isSuggestionCommand = (suggestion: Suggestion): suggestion is SuggestionCommand =>
  'args' in suggestion;

export const isSuggestionEmoji = (suggestion: Suggestion): suggestion is Emoji =>
  'unicode' in suggestion;

export const isSuggestionUser = (suggestion: Suggestion): suggestion is SuggestionUser =>
  'id' in suggestion;

export type Suggestion = Emoji | SuggestionCommand | SuggestionUser;

export type SuggestionCommand = CommandResponse;
export type SuggestionUser = UserResponse;

export type Suggestions = Suggestion[];

export type SuggestionsContextValue = {
  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<AutoCompleteSuggestionItemProps>;
  AutoCompleteSuggestionList: React.ComponentType<AutoCompleteSuggestionListProps>;
  /** Override handler for closing suggestions (mentions, command autocomplete etc) */
  closeSuggestions: () => void;
  /**
   * Override handler for opening suggestions (mentions, command autocomplete etc)
   *
   * @param component {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  openSuggestions: (component: SuggestionComponentType) => Promise<void>;
  suggestions: Suggestions;
  triggerType?: string;
  /**
   * Override handler for updating suggestions (mentions, command autocomplete etc)
   *
   * @param newSuggestions {Component|element} UI Component for suggestion item.
   * @overrideType Function
   */
  updateSuggestions: (newSuggestions: Suggestions) => void;
  queryText?: string;
  suggestionsViewActive?: boolean;
};

export const SuggestionsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as SuggestionsContextValue,
);

/**
 * This provider component exposes the properties stored within the SuggestionsContext.
 */
export const SuggestionsProvider = ({
  children,
  value,
}: PropsWithChildren<{ value?: Partial<SuggestionsContextValue> }>) => {
  const { AutoCompleteSuggestionHeader, AutoCompleteSuggestionItem, AutoCompleteSuggestionList } =
    value ?? {};
  const [triggerType, setTriggerType] = useState<SuggestionComponentType | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions>();
  const [suggestionsViewActive, setSuggestionsViewActive] = useState(false);

  const openSuggestions = useCallback((component: SuggestionComponentType) => {
    setTriggerType(component);
    setSuggestionsViewActive(true);
  }, []);

  const updateSuggestions = useCallback(
    (newSuggestions: Suggestions) => {
      setSuggestions(newSuggestions);
      setSuggestionsViewActive(!!triggerType);
    },
    [triggerType],
  );

  const closeSuggestions = useCallback(() => {
    setTriggerType(null);
    setSuggestions(undefined);
    setSuggestionsViewActive(false);
  }, []);

  const suggestionsContext = useMemo(() => {
    return {
      AutoCompleteSuggestionHeader,
      AutoCompleteSuggestionItem,
      AutoCompleteSuggestionList,
      closeSuggestions,
      openSuggestions,
      suggestions,
      suggestionsViewActive,
      triggerType,
      updateSuggestions,
    };
  }, [
    AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem,
    AutoCompleteSuggestionList,
    closeSuggestions,
    openSuggestions,
    suggestions,
    suggestionsViewActive,
    triggerType,
    updateSuggestions,
  ]);

  return (
    <SuggestionsContext.Provider value={suggestionsContext as unknown as SuggestionsContextValue}>
      {children}
    </SuggestionsContext.Provider>
  );
};

export const useSuggestionsContext = () => {
  const contextValue = useContext(SuggestionsContext) as unknown as SuggestionsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useSuggestionsContext hook was called outside of the SuggestionsContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
