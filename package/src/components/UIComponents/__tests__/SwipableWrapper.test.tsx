import React from 'react';
import { I18nManager, Text, View } from 'react-native';

import { act, render } from '@testing-library/react-native';

import {
  SwipeRegistryProvider,
  useSwipeRegistryContext,
} from '../../../contexts/swipeableContext/SwipeRegistryContext';
import { SwipableWrapper } from '../SwipableWrapper';

const mockReanimatedSwipeable = jest.fn(({ children }: React.PropsWithChildren) => (
  <View>{children}</View>
));

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: (...args: [React.PropsWithChildren]) => mockReanimatedSwipeable(...args),
  SwipeDirection: {
    LEFT: 'left',
    RIGHT: 'right',
  },
}));

describe('SwipableWrapper', () => {
  const originalIsRTL = I18nManager.isRTL;

  const setRTL = (value: boolean) => {
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      value,
    });
  };

  const renderWithRegistry = (ui: React.ReactElement) =>
    render(<SwipeRegistryProvider>{ui}</SwipeRegistryProvider>);

  beforeEach(() => {
    mockReanimatedSwipeable.mockClear();
  });

  afterEach(() => {
    setRTL(originalIsRTL);
  });

  it('uses right-side overshoot defaults in ltr', () => {
    setRTL(false);

    renderWithRegistry(
      <SwipableWrapper>
        <Text>child</Text>
      </SwipableWrapper>,
    );

    expect(mockReanimatedSwipeable).toHaveBeenCalledWith(
      expect.objectContaining({
        overshootLeft: false,
        overshootRight: true,
      }),
      undefined,
    );
  });

  it('uses left-side overshoot defaults in rtl', () => {
    setRTL(true);

    renderWithRegistry(
      <SwipableWrapper>
        <Text>child</Text>
      </SwipableWrapper>,
    );

    expect(mockReanimatedSwipeable).toHaveBeenCalledWith(
      expect.objectContaining({
        overshootLeft: true,
        overshootRight: false,
      }),
      undefined,
    );
  });

  it('maps logical right actions to left actions in rtl', () => {
    setRTL(true);

    const renderRightActions = jest.fn(() => null);

    renderWithRegistry(
      <SwipableWrapper swipableProps={{ renderRightActions }}>
        <Text>child</Text>
      </SwipableWrapper>,
    );

    expect(mockReanimatedSwipeable).toHaveBeenCalledWith(
      expect.objectContaining({
        renderLeftActions: renderRightActions,
        renderRightActions: undefined,
      }),
      undefined,
    );
  });
  describe('swipe registry', () => {
    type Registry = ReturnType<typeof useSwipeRegistryContext>;

    const RegistryProbe = ({ onRegistry }: { onRegistry: (registry: Registry) => void }) => {
      onRegistry(useSwipeRegistryContext());
      return null;
    };

    const Rows = ({ ids, onRegistry }: { ids: string[]; onRegistry: (r: Registry) => void }) => (
      <SwipeRegistryProvider>
        <RegistryProbe onRegistry={onRegistry} />
        {ids.map((id) => (
          <SwipableWrapper key={id} swipeableId={id}>
            <Text>{id}</Text>
          </SwipableWrapper>
        ))}
      </SwipeRegistryProvider>
    );

    // The mocked swipeable gets the row's <Text> as children, so its label identifies the row.
    const openRow = (id: string) => {
      const props = mockReanimatedSwipeable.mock.calls
        .map(([callProps]) => callProps as React.PropsWithChildren<Record<string, unknown>>)
        .filter(
          (callProps) =>
            React.isValidElement<{ children: string }>(callProps.children) &&
            callProps.children.props.children === id,
        )
        .pop();
      act(() => {
        (props?.onSwipeableOpenStartDrag as (direction: string) => void)('left');
      });
    };

    it('stops reporting an open swipeable once that swipeable unmounts', () => {
      let registry: Registry | undefined;
      const onRegistry = (r: Registry) => {
        registry = r;
      };
      const { rerender } = render(<Rows ids={['a', 'b']} onRegistry={onRegistry} />);

      openRow('b');
      expect(registry?.hasOpen()).toBe(true);

      // e.g. a pull-to-refresh that drops the page holding the open row
      rerender(<Rows ids={['a']} onRegistry={onRegistry} />);

      expect(registry?.hasOpen()).toBe(false);
    });

    it('keeps another row open when a closed row unmounts', () => {
      let registry: Registry | undefined;
      const onRegistry = (r: Registry) => {
        registry = r;
      };
      const { rerender } = render(<Rows ids={['a', 'b']} onRegistry={onRegistry} />);

      openRow('a');
      rerender(<Rows ids={['a']} onRegistry={onRegistry} />);

      expect(registry?.hasOpen()).toBe(true);
    });
  });
});
