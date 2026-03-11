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

jest.mock('react-native-teleport', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  return {
    Portal: View,
    PortalHost: ({ name }: { name: string }) => (
      <View testID={`portal-host-${name}`}>
        <Text>{name}</Text>
      </View>
    ),
    PortalProvider: View,
    usePortal: jest.fn().mockReturnValue({ removePortal: jest.fn() }),
  };
});

import React from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { act, cleanup, render, screen } from '@testing-library/react-native';

import { clearClosingPortalLayout, setClosingPortalLayout } from '../../../state-store';
import { ClosingPortalHostsLayer } from '../ClosingPortalHostsLayer';

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
    const { toJSON } = render(
      <ClosingPortalHostsLayer closeCoverOpacity={{ value: 0.5 } as SharedValue<number>} />,
    );

    act(() => {
      setClosingPortalLayout('overlay-header', 'first-entry', FIRST_RECT);
    });

    let tree = toJSON();
    let slot = Array.isArray(tree) ? tree[0] : tree;

    expect(slot).toMatchObject({
      children: [
        expect.objectContaining({
          props: expect.objectContaining({ testID: 'portal-host-overlay-header' }),
        }),
      ],
      props: expect.objectContaining({
        pointerEvents: 'box-none',
        style: expect.objectContaining({
          height: FIRST_RECT.h,
          left: FIRST_RECT.x,
          opacity: 0.5,
          position: 'absolute',
          top: FIRST_RECT.y,
          width: FIRST_RECT.w,
        }),
      }),
    });

    act(() => {
      setClosingPortalLayout('overlay-header', 'second-entry', SECOND_RECT);
    });

    tree = toJSON();
    slot = Array.isArray(tree) ? tree[0] : tree;

    expect(slot).toMatchObject({
      children: [
        expect.objectContaining({
          props: expect.objectContaining({ testID: 'portal-host-overlay-header' }),
        }),
      ],
      props: expect.objectContaining({
        pointerEvents: 'box-none',
        style: expect.objectContaining({
          height: SECOND_RECT.h,
          left: SECOND_RECT.x,
          opacity: 0.5,
          position: 'absolute',
          top: SECOND_RECT.y,
          width: SECOND_RECT.w,
        }),
      }),
    });

    act(() => {
      clearClosingPortalLayout('overlay-header', 'second-entry');
    });

    tree = toJSON();
    slot = Array.isArray(tree) ? tree[0] : tree;

    expect(slot).toMatchObject({
      children: [
        expect.objectContaining({
          props: expect.objectContaining({ testID: 'portal-host-overlay-header' }),
        }),
      ],
      props: expect.objectContaining({
        pointerEvents: 'box-none',
        style: expect.objectContaining({
          height: FIRST_RECT.h,
          left: FIRST_RECT.x,
          opacity: 0.5,
          position: 'absolute',
          top: FIRST_RECT.y,
          width: FIRST_RECT.w,
        }),
      }),
    });

    act(() => {
      clearClosingPortalLayout('overlay-header', 'first-entry');
    });

    expect(toJSON()).toBeNull();
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

    expect(screen.getAllByTestId('portal-host-overlay-header')).toHaveLength(1);
    expect(screen.getAllByTestId('portal-host-overlay-composer')).toHaveLength(1);
  });
});
