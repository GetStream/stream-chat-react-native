import { useCallback } from 'react';

import { StateStore } from 'stream-chat';

import { useStateStore } from '../hooks/useStateStore';

export type SelectionState<T = string> = {
  /** Ids of the currently selected items. */
  selectedIds: Set<T>;
};

const createInitialState = <T>(): SelectionState<T> => ({
  selectedIds: new Set<T>(),
});

/**
 * Holds a generic selection state (a set of selected ids). Leaf components can
 * subscribe to narrow slices via `useStateStore`. The id type defaults to
 * `string` (e.g. user ids in the "add members to channel" flow) but can be
 * specialised for any other selectable entity.
 */
export class SelectionStore<T = string> {
  public state = new StateStore<SelectionState<T>>(createInitialState<T>());

  select(id?: T) {
    if (id === undefined || id === null) {
      return;
    }
    const { selectedIds } = this.state.getLatestValue();
    if (selectedIds.has(id)) {
      return;
    }
    const next = new Set(selectedIds);
    next.add(id);
    this.state.partialNext({ selectedIds: next });
  }

  deselect(id?: T) {
    if (id === undefined || id === null) {
      return;
    }
    const { selectedIds } = this.state.getLatestValue();
    if (!selectedIds.has(id)) {
      return;
    }
    const next = new Set(selectedIds);
    next.delete(id);
    this.state.partialNext({ selectedIds: next });
  }

  toggle(id?: T) {
    if (id === undefined || id === null) {
      return;
    }
    const { selectedIds } = this.state.getLatestValue();
    if (selectedIds.has(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }
}

const selectIsSelectionEmpty = <T>(state: SelectionState<T>) => ({
  isSelectionEmpty: state.selectedIds.size === 0,
});

/**
 * Subscribes to a {@link SelectionStore} and returns whether the selection is
 * currently empty.
 */
export const useIsSelectionEmpty = <T>(store: SelectionStore<T>) =>
  useStateStore(store.state, selectIsSelectionEmpty).isSelectionEmpty;

/**
 * Subscribes to a {@link SelectionStore} and returns whether the given id is
 * currently selected.
 */
export const useIsSelected = <T>(store: SelectionStore<T>, id: T) => {
  const selector = useCallback(
    (state: SelectionState<T>) => ({ isSelected: state.selectedIds.has(id) }),
    [id],
  );
  return useStateStore(store.state, selector).isSelected;
};
