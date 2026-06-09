import { act, renderHook } from '@testing-library/react-native';

import { SelectionStore, useIsSelected, useIsSelectionEmpty } from '../selection-store';

describe('SelectionStore', () => {
  it('starts from the expected initial state', () => {
    const store = new SelectionStore();
    const state = store.state.getLatestValue();

    expect(state.selectedIds.size).toBe(0);
  });

  describe('select', () => {
    it('adds an id and clones the set', () => {
      const store = new SelectionStore();
      const initial = store.state.getLatestValue().selectedIds;

      store.select('a');

      const afterAdd = store.state.getLatestValue().selectedIds;
      expect(afterAdd.has('a')).toBe(true);
      expect(afterAdd).not.toBe(initial);
    });

    it('is idempotent when the id is already selected', () => {
      const store = new SelectionStore();
      store.select('a');
      const before = store.state.getLatestValue().selectedIds;

      store.select('a');

      const after = store.state.getLatestValue().selectedIds;
      expect(after).toBe(before);
      expect(Array.from(after)).toEqual(['a']);
    });

    it('is a no-op for an undefined id', () => {
      const store = new SelectionStore();
      const before = store.state.getLatestValue().selectedIds;

      store.select(undefined);

      expect(store.state.getLatestValue().selectedIds).toBe(before);
    });

    it('supports non-string id types', () => {
      const store = new SelectionStore<number>();

      store.select(1);

      expect(store.state.getLatestValue().selectedIds.has(1)).toBe(true);
    });
  });

  describe('deselect', () => {
    it('removes a previously selected id and clones the set', () => {
      const store = new SelectionStore();
      store.select('a');
      const beforeRemove = store.state.getLatestValue().selectedIds;

      store.deselect('a');

      const afterRemove = store.state.getLatestValue().selectedIds;
      expect(afterRemove.has('a')).toBe(false);
      expect(afterRemove).not.toBe(beforeRemove);
    });

    it('is a no-op when the id is not selected', () => {
      const store = new SelectionStore();
      const before = store.state.getLatestValue().selectedIds;

      store.deselect('a');

      expect(store.state.getLatestValue().selectedIds).toBe(before);
    });

    it('is a no-op for an undefined id', () => {
      const store = new SelectionStore();
      store.select('a');
      const before = store.state.getLatestValue().selectedIds;

      store.deselect(undefined);

      expect(store.state.getLatestValue().selectedIds).toBe(before);
    });
  });

  describe('toggle', () => {
    it('selects an unselected id', () => {
      const store = new SelectionStore();

      store.toggle('a');

      expect(store.state.getLatestValue().selectedIds.has('a')).toBe(true);
    });

    it('deselects an already-selected id', () => {
      const store = new SelectionStore();
      store.select('a');

      store.toggle('a');

      expect(store.state.getLatestValue().selectedIds.has('a')).toBe(false);
    });

    it('is a no-op for an undefined id', () => {
      const store = new SelectionStore();
      const before = store.state.getLatestValue().selectedIds;

      store.toggle(undefined);

      expect(store.state.getLatestValue().selectedIds).toBe(before);
    });
  });
});

describe('useIsSelectionEmpty', () => {
  it('returns true when nothing is selected', () => {
    const store = new SelectionStore();

    const { result } = renderHook(() => useIsSelectionEmpty(store));

    expect(result.current).toBe(true);
  });

  it('reacts to selection and deselection', () => {
    const store = new SelectionStore();

    const { result } = renderHook(() => useIsSelectionEmpty(store));
    expect(result.current).toBe(true);

    act(() => store.select('a'));
    expect(result.current).toBe(false);

    act(() => store.deselect('a'));
    expect(result.current).toBe(true);
  });
});

describe('useIsSelected', () => {
  it('returns false when the id is not selected', () => {
    const store = new SelectionStore();

    const { result } = renderHook(() => useIsSelected(store, 'a'));

    expect(result.current).toBe(false);
  });

  it('reacts to the id being selected and deselected', () => {
    const store = new SelectionStore();

    const { result } = renderHook(() => useIsSelected(store, 'a'));
    expect(result.current).toBe(false);

    act(() => store.select('a'));
    expect(result.current).toBe(true);

    act(() => store.deselect('a'));
    expect(result.current).toBe(false);
  });

  it('only tracks the requested id', () => {
    const store = new SelectionStore();

    const { result } = renderHook(() => useIsSelected(store, 'a'));

    act(() => store.select('b'));
    expect(result.current).toBe(false);
  });

  it('re-evaluates when the requested id changes', () => {
    const store = new SelectionStore();
    store.select('a');

    const { result, rerender } = renderHook(({ id }) => useIsSelected(store, id), {
      initialProps: { id: 'a' },
    });
    expect(result.current).toBe(true);

    rerender({ id: 'b' });
    expect(result.current).toBe(false);
  });
});
