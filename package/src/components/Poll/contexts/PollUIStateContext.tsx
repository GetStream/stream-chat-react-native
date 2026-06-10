import React, { PropsWithChildren, useContext, useState } from 'react';

import { StateStore } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../../../contexts/utils/defaultBaseContextValue';
import { isTestEnvironment } from '../../../contexts/utils/isTestEnvironment';
import { useStateStore } from '../../../hooks/useStateStore';

export type PollUIState = {
  addCommentOpen: boolean;
  allCommentsOpen: boolean;
  allOptionsOpen: boolean;
  suggestOptionOpen: boolean;
  viewResultsOpen: boolean;
};

const INITIAL_POLL_UI_STATE: PollUIState = {
  addCommentOpen: false,
  allCommentsOpen: false,
  allOptionsOpen: false,
  suggestOptionOpen: false,
  viewResultsOpen: false,
};

export type PollUIStateContextValue = {
  closeAddComment: () => void;
  closeAllComments: () => void;
  closeAllOptions: () => void;
  closeSuggestOption: () => void;
  closeViewResults: () => void;
  openAddComment: () => void;
  openAllComments: () => void;
  openAllOptions: () => void;
  openSuggestOption: () => void;
  openViewResults: () => void;
  store: StateStore<PollUIState>;
};

export const PollUIStateContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as PollUIStateContextValue,
);

export const PollUIStateProvider = ({ children }: PropsWithChildren) => {
  const value = useState<PollUIStateContextValue>(() => {
    const store = new StateStore<PollUIState>(INITIAL_POLL_UI_STATE);
    return {
      closeAddComment: () => store.partialNext({ addCommentOpen: false }),
      closeAllComments: () => store.partialNext({ allCommentsOpen: false }),
      closeAllOptions: () => store.partialNext({ allOptionsOpen: false }),
      closeSuggestOption: () => store.partialNext({ suggestOptionOpen: false }),
      closeViewResults: () => store.partialNext({ viewResultsOpen: false }),
      openAddComment: () => store.partialNext({ addCommentOpen: true }),
      openAllComments: () => store.partialNext({ allCommentsOpen: true }),
      openAllOptions: () => store.partialNext({ allOptionsOpen: true }),
      openSuggestOption: () => store.partialNext({ suggestOptionOpen: true }),
      openViewResults: () => store.partialNext({ viewResultsOpen: true }),
      store,
    };
  })[0];

  return <PollUIStateContext.Provider value={value}>{children}</PollUIStateContext.Provider>;
};

export const usePollUIStateContext = () => {
  const contextValue = useContext(PollUIStateContext) as unknown as PollUIStateContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'usePollUIStateContext must be used within a PollUIStateProvider. The provider is mounted by the Poll component automatically.',
    );
  }

  return contextValue;
};

const selectAddCommentOpen = ({ addCommentOpen }: PollUIState) => ({ addCommentOpen });
const selectAllCommentsOpen = ({ allCommentsOpen }: PollUIState) => ({ allCommentsOpen });
const selectAllOptionsOpen = ({ allOptionsOpen }: PollUIState) => ({ allOptionsOpen });
const selectSuggestOptionOpen = ({ suggestOptionOpen }: PollUIState) => ({ suggestOptionOpen });
const selectViewResultsOpen = ({ viewResultsOpen }: PollUIState) => ({ viewResultsOpen });

export const useAddCommentOpen = () => {
  const { store } = usePollUIStateContext();
  return useStateStore(store, selectAddCommentOpen).addCommentOpen;
};

export const useAllCommentsOpen = () => {
  const { store } = usePollUIStateContext();
  return useStateStore(store, selectAllCommentsOpen).allCommentsOpen;
};

export const useAllOptionsOpen = () => {
  const { store } = usePollUIStateContext();
  return useStateStore(store, selectAllOptionsOpen).allOptionsOpen;
};

export const useSuggestOptionOpen = () => {
  const { store } = usePollUIStateContext();
  return useStateStore(store, selectSuggestOptionOpen).suggestOptionOpen;
};

export const useViewResultsOpen = () => {
  const { store } = usePollUIStateContext();
  return useStateStore(store, selectViewResultsOpen).viewResultsOpen;
};
