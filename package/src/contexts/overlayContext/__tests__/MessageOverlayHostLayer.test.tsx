import React from 'react';
import { StyleSheet, Text } from 'react-native';

import * as SafeAreaContext from 'react-native-safe-area-context';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import {
  finalizeCloseOverlay,
  openOverlay,
  overlayStore,
  setOverlayBottomH,
  setOverlayMessageH,
  setOverlayTopH,
} from '../../../state-store';
import { MessageOverlayHostLayer } from '../MessageOverlayHostLayer';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');

  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === 'useWindowDimensions') {
        return () => ({ fontScale: 1, height: 200, scale: 1, width: 320 });
      }

      return Reflect.get(target, prop, receiver);
    },
  });
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const actual = jest.requireActual('react-native-reanimated/mock');
  const { View } = require('react-native');

  const useStableSharedValue = (init: unknown) => {
    const ref = React.useRef<{
      value: unknown;
    }>();

    if (!ref.current) {
      const value = { value: init };
      ref.current = new Proxy(value, {
        get(target, prop) {
          if (prop === 'value') {
            return target.value;
          }

          return undefined;
        },
        set(target, prop, nextValue) {
          if (prop === 'value') {
            target.value = nextValue;
            return true;
          }

          return false;
        },
      });
    }

    return ref.current;
  };

  return {
    ...actual,
    Animated: {
      ...actual.default,
      View,
    },
    default: {
      ...actual.default,
      View,
    },
    clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useDerivedValue: (updater: () => unknown) => ({ value: updater() }),
    useSharedValue: useStableSharedValue,
    withSpring: (value: unknown) => value,
  };
});

const TOP_RECT = { h: 20, w: 90, x: 5, y: 0 };
const MESSAGE_RECT = { h: 50, w: 180, x: 10, y: 0 };
const BOTTOM_RECT = { h: 30, w: 140, x: 20, y: 100 };
const NoopBackground = () => null;

const flushAnimationFrameQueue = () => {
  act(() => {
    jest.runAllTimers();
  });
};

describe('MessageOverlayHostLayer', () => {
  let useSafeAreaInsetsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    useSafeAreaInsetsSpy = jest.spyOn(SafeAreaContext, 'useSafeAreaInsets').mockReturnValue({
      bottom: 15,
      left: 0,
      right: 0,
      top: 10,
    });

    act(() => {
      finalizeCloseOverlay();
      overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });
  });

  afterEach(() => {
    cleanup();

    act(() => {
      finalizeCloseOverlay();
      overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });

    useSafeAreaInsetsSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the custom background only while active and pressing the backdrop starts closing', () => {
    const CustomBackground = () => <Text testID='custom-background'>Background</Text>;
    render(<MessageOverlayHostLayer BackgroundComponent={CustomBackground} />);

    expect(screen.queryByTestId('custom-background')).toBeNull();
    expect(screen.queryByTestId('message-overlay-backdrop')).toBeNull();

    act(() => {
      openOverlay('message-1');
    });

    expect(screen.getByTestId('custom-background')).toBeTruthy();
    expect(screen.getByTestId('message-overlay-backdrop')).toBeTruthy();

    fireEvent.press(screen.getByTestId('message-overlay-backdrop'));
    flushAnimationFrameQueue();

    expect(overlayStore.getLatestValue().closing).toBe(true);
  });

  it('positions and translates the top, message, and bottom hosts using the registered rects', () => {
    const { rerender } = render(<MessageOverlayHostLayer BackgroundComponent={NoopBackground} />);

    act(() => {});

    act(() => {
      setOverlayTopH(TOP_RECT);
      setOverlayMessageH(MESSAGE_RECT);
      setOverlayBottomH(BOTTOM_RECT);
      openOverlay('message-1');
    });

    rerender(<MessageOverlayHostLayer BackgroundComponent={NoopBackground} />);

    const topSlot = screen.getByTestId('message-overlay-top');
    const messageSlot = screen.getByTestId('message-overlay-message');
    const bottomSlot = screen.getByTestId('message-overlay-bottom');

    expect(StyleSheet.flatten(topSlot.props.style)).toMatchObject({
      height: TOP_RECT.h,
      left: TOP_RECT.x,
      position: 'absolute',
      top: TOP_RECT.y,
      transform: [{ scale: 1 }, { translateY: 38 }],
      width: TOP_RECT.w,
    });
    expect(StyleSheet.flatten(messageSlot.props.style)).toMatchObject({
      height: MESSAGE_RECT.h,
      left: MESSAGE_RECT.x,
      position: 'absolute',
      top: MESSAGE_RECT.y,
      transform: [{ translateY: 38 }],
      width: MESSAGE_RECT.w,
    });
    expect(StyleSheet.flatten(bottomSlot.props.style)).toMatchObject({
      height: BOTTOM_RECT.h,
      left: BOTTOM_RECT.x,
      position: 'absolute',
      top: BOTTOM_RECT.y,
      transform: [{ scale: 1 }, { translateY: -12 }],
      width: BOTTOM_RECT.w,
    });
  });

  it('resets host geometry after finalizeCloseOverlay clears the registered rects', () => {
    const { rerender } = render(<MessageOverlayHostLayer BackgroundComponent={NoopBackground} />);

    act(() => {});

    act(() => {
      setOverlayTopH(TOP_RECT);
      setOverlayMessageH(MESSAGE_RECT);
      setOverlayBottomH(BOTTOM_RECT);
      openOverlay('message-1');
    });

    rerender(<MessageOverlayHostLayer BackgroundComponent={NoopBackground} />);

    expect(
      StyleSheet.flatten(screen.getByTestId('message-overlay-message').props.style),
    ).toMatchObject({
      height: MESSAGE_RECT.h,
      width: MESSAGE_RECT.w,
    });

    act(() => {
      finalizeCloseOverlay();
    });

    rerender(<MessageOverlayHostLayer BackgroundComponent={NoopBackground} />);

    expect(StyleSheet.flatten(screen.getByTestId('message-overlay-top').props.style)).toMatchObject(
      {
        height: 0,
      },
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('message-overlay-message').props.style),
    ).toMatchObject({ height: 0 });
    expect(
      StyleSheet.flatten(screen.getByTestId('message-overlay-bottom').props.style),
    ).toMatchObject({
      height: 0,
    });
  });
});
