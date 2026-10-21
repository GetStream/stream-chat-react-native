import { act, renderHook } from '@testing-library/react-native';

import { useRAFCoalescedValue } from '../useRAFCoalescedValue';

describe('useRAFCoalescedValue', () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    jest.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const flushFrame = () =>
    act(() => {
      frames.splice(0).forEach((callback) => callback(0));
    });

  it('publishes the latest value once per frame', () => {
    const { rerender, result } = renderHook(
      ({ value }: { value: string }) => useRAFCoalescedValue(value, true),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    expect(result.current).toBe('a');
    expect(frames).toHaveLength(1);

    flushFrame();
    expect(result.current).toBe('c');
  });

  it('returns the value as is while disabled', () => {
    const { rerender, result } = renderHook(
      ({ value }: { value: string }) => useRAFCoalescedValue(value, false),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    expect(result.current).toBe('b');
    expect(frames).toHaveLength(0);
  });

  it('shows the last published value when re-enabled with it', () => {
    const { rerender, result } = renderHook(
      ({ isEnabled, value }: { isEnabled: boolean; value: string }) =>
        useRAFCoalescedValue(value, isEnabled),
      { initialProps: { isEnabled: true, value: 'a' } },
    );

    rerender({ isEnabled: true, value: 'b' });
    flushFrame();
    rerender({ isEnabled: false, value: 'c' });
    rerender({ isEnabled: true, value: 'b' });

    expect(result.current).toBe('b');
  });

  it('publishes a value that changed while disabled once re-enabled', () => {
    const { rerender, result } = renderHook(
      ({ isEnabled, value }: { isEnabled: boolean; value: string }) =>
        useRAFCoalescedValue(value, isEnabled),
      { initialProps: { isEnabled: true, value: 'a' } },
    );

    rerender({ isEnabled: false, value: 'b' });
    rerender({ isEnabled: true, value: 'b' });
    flushFrame();

    expect(result.current).toBe('b');
  });
});
