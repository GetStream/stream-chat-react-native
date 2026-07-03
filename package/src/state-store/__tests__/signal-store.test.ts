import { SignalStore } from '../signal-store';

describe('SignalStore', () => {
  it('starts from the expected initial state', () => {
    const store = new SignalStore();

    expect(store.state.getLatestValue().signal).toBe(false);
  });

  it('settles back to false after signalling', () => {
    const store = new SignalStore();

    store.signal();

    expect(store.state.getLatestValue().signal).toBe(false);
  });

  it('emits a true then false pulse to subscribers', () => {
    const store = new SignalStore();
    const observed: boolean[] = [];

    const unsubscribe = store.state.subscribeWithSelector(
      (state) => ({ signal: state.signal }),
      ({ signal }) => observed.push(signal),
    );

    store.signal();
    unsubscribe();

    // subscribeWithSelector emits the initial value (false) immediately, then the
    // signal() pulse drives a true followed by a false. The `if (signal)` guard in
    // ChannelDetailsModal only reacts to the true edge.
    expect(observed).toEqual([false, true, false]);
  });
});
