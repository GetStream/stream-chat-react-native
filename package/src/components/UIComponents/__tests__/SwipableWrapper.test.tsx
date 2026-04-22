import React from 'react';
import { I18nManager, Text, View } from 'react-native';

import { render } from '@testing-library/react-native';

import { SwipeRegistryProvider } from '../../../contexts/swipeableContext/SwipeRegistryContext';
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
});
