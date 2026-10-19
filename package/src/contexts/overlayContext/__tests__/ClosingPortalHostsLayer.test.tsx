import React from 'react';
import { StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { act, cleanup, render, screen } from '@testing-library/react-native';

import { clearClosingPortalLayout, setClosingPortalLayout } from '../../../state-store';
import { ClosingPortalHostsLayer } from '../ClosingPortalHostsLayer';

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated/mock');
  const { View } = require('react-native');

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
    makeMutable: (value: unknown) => ({ value }),
    useAnimatedStyle: (updater: () => unknown) => updater(),
  };
});

const FIRST_RECT = { h: 40, w: 100, x: 10, y: 20 };
const SECOND_RECT = { h: 52, w: 140, x: 30, y: 45 };

describe('ClosingPortalHostsLayer', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    act(() => {
      clearClosingPortalLayout('overlay-header', 'first-entry');
      clearClosingPortalLayout('overlay-header', 'second-entry');
      clearClosingPortalLayout('overlay-composer', 'composer-entry');
    });
    cleanup();
  });

  it('renders the geometry for the top-most registration of a host and falls back when it is removed', () => {
    render(<ClosingPortalHostsLayer closeCoverOpacity={{ value: 0.5 } as SharedValue<number>} />);

    act(() => {
      setClosingPortalLayout('overlay-header', 'first-entry', FIRST_RECT);
    });

    expect(
      StyleSheet.flatten(screen.getByTestId('closing-portal-host-slot-overlay-header').props.style),
    ).toMatchObject({
      height: FIRST_RECT.h,
      left: FIRST_RECT.x,
      opacity: 0.5,
      position: 'absolute',
      top: FIRST_RECT.y,
      width: FIRST_RECT.w,
    });

    act(() => {
      setClosingPortalLayout('overlay-header', 'second-entry', SECOND_RECT);
    });

    expect(
      StyleSheet.flatten(screen.getByTestId('closing-portal-host-slot-overlay-header').props.style),
    ).toMatchObject({
      height: SECOND_RECT.h,
      left: SECOND_RECT.x,
      opacity: 0.5,
      position: 'absolute',
      top: SECOND_RECT.y,
      width: SECOND_RECT.w,
    });

    act(() => {
      clearClosingPortalLayout('overlay-header', 'second-entry');
    });

    expect(
      StyleSheet.flatten(screen.getByTestId('closing-portal-host-slot-overlay-header').props.style),
    ).toMatchObject({
      height: FIRST_RECT.h,
      left: FIRST_RECT.x,
      opacity: 0.5,
      position: 'absolute',
      top: FIRST_RECT.y,
      width: FIRST_RECT.w,
    });

    act(() => {
      clearClosingPortalLayout('overlay-header', 'first-entry');
    });

    expect(screen.queryByTestId('closing-portal-host-slot-overlay-header')).toBeNull();
  });

  it('renders one closing host slot per host name even when multiple entries are registered', () => {
    render(<ClosingPortalHostsLayer closeCoverOpacity={{ value: 1 } as SharedValue<number>} />);

    act(() => {
      setClosingPortalLayout('overlay-header', 'first-entry', FIRST_RECT);
      setClosingPortalLayout('overlay-header', 'second-entry', SECOND_RECT);
      setClosingPortalLayout('overlay-composer', 'composer-entry', {
        h: 60,
        w: 160,
        x: 5,
        y: 200,
      });
    });

    expect(screen.getAllByTestId('closing-portal-host-slot-overlay-header')).toHaveLength(1);
    expect(screen.getAllByTestId('closing-portal-host-slot-overlay-composer')).toHaveLength(1);
  });

  it('parks its hosts under names unique to its host layer while that layer is not the top one', () => {
    const renderLayer = (isTopHostLayer: boolean) => (
      <ClosingPortalHostsLayer
        closeCoverOpacity={{ value: 0 } as SharedValue<number>}
        hostLayerId='root-layer'
        isTopHostLayer={isTopHostLayer}
      />
    );
    const getHostsNamed = (name: string) =>
      screen.UNSAFE_root.findAll(
        (node) => typeof node.type === 'string' && node.props.name === name,
      );
    const { rerender } = render(renderLayer(false));

    act(() => {
      setClosingPortalLayout('overlay-composer', 'composer-entry', FIRST_RECT);
    });

    expect(getHostsNamed('overlay-composer')).toHaveLength(0);
    expect(getHostsNamed('overlay-composer:root-layer')).toHaveLength(1);

    rerender(renderLayer(true));

    expect(getHostsNamed('overlay-composer')).toHaveLength(1);
    expect(getHostsNamed('overlay-composer:root-layer')).toHaveLength(0);
  });
});
