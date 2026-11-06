import { useCallback } from 'react';

import { StateStore } from '@stream-io/state-store';

import { useStateStore } from '../hooks/useStateStore';

export type SelectionState<T = string> = {
  /** IDs of the currently selected items. */
  selectedIds: Set<T>;
};

const createInitialState = <T>(): SelectionState<T> => ({
  selectedIds: new Set<T>(),
});

/** Holds a set of selected item IDs, of type `T` (defaults to `string`). */
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
 * Subscribes to the store and returns whether the selection is empty.
 *
 * @param store The store to subscribe to.
 * @returns True when no item is selected.
 */
export const useIsSelectionEmpty = <T>(store: SelectionStore<T>) =>
  useStateStore(store.state, selectIsSelectionEmpty).isSelectionEmpty;

/**
 * Subscribes to the store and returns whether an item is selected.
 *
 * @param store The store to subscribe to.
 * @param id The item ID.
 * @returns True when the item is selected.
 */
export const useIsSelected = <T>(store: SelectionStore<T>, id: T) => {
  const selector = useCallback(
    (state: SelectionState<T>) => ({ isSelected: state.selectedIds.has(id) }),
    [id],
  );
  return useStateStore(store.state, selector).isSelected;
};
