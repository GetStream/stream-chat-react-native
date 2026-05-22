import React from 'react';
import { Text } from 'react-native';

import { act, cleanup, render, renderHook, screen } from '@testing-library/react-native';

import {
  clearClosingPortalLayout,
  closeOverlay,
  finalizeCloseOverlay,
  openOverlay,
  overlayStore,
  setClosingPortalLayout,
  useClosingPortalHostBlacklist,
  useClosingPortalHostBlacklistState,
  useShouldTeleportToClosingPortal,
} from '../message-overlay-store';

const BASE_RECT = { h: 40, w: 100, x: 10, y: 20 };

type RegisteredLayout = {
  hostName: string;
  id: string;
};

const flushAnimationFrameQueue = () => {
  act(() => {
    jest.runAllTimers();
  });
};

const BlacklistRegistrar = ({
  enabled = true,
  hostNames,
}: {
  enabled?: boolean;
  hostNames: string[];
}) => {
  useClosingPortalHostBlacklist(hostNames, enabled);
  return null;
};

const BlacklistProbe = () => {
  const hostNames = useClosingPortalHostBlacklistState();

  return <Text testID='blacklist-state'>{hostNames.join(',') || 'empty'}</Text>;
};

describe('message overlay store portal hooks', () => {
  let registeredLayouts: RegisteredLayout[] = [];

  const rememberLayout = (hostName: string, id: string, layout = BASE_RECT) => {
    registeredLayouts.push({ hostName, id });
    act(() => {
      setClosingPortalLayout(hostName, id, layout);
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    registeredLayouts = [];

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
      registeredLayouts.forEach(({ hostName, id }) => {
        clearClosingPortalLayout(hostName, id);
      });
      finalizeCloseOverlay();
      overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });

    registeredLayouts = [];
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('returns true only for the top-most registration when the overlay is closing', () => {
    const first = renderHook(() => useShouldTeleportToClosingPortal('overlay-composer', 'first'));
    const second = renderHook(() => useShouldTeleportToClosingPortal('overlay-composer', 'second'));

    rememberLayout('overlay-composer', 'first');

    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);

    act(() => {
      openOverlay('message-1');
      closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(false);

    rememberLayout('overlay-composer', 'second', { ...BASE_RECT, x: 30, y: 50 });

    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(true);

    act(() => {
      clearClosingPortalLayout('overlay-composer', 'second');
    });

    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(false);

    first.unmount();
    second.unmount();
  });

  it('does not enter closing when closeOverlay is called without an active overlay id', () => {
    act(() => {
      closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(overlayStore.getLatestValue()).toMatchObject({
      closing: false,
      id: undefined,
    });
  });

  it('does not teleport when closing is true but there is no active overlay id', () => {
    const result = renderHook(() =>
      useShouldTeleportToClosingPortal('overlay-composer', 'composer'),
    );

    rememberLayout('overlay-composer', 'composer');

    act(() => {
      overlayStore.next({
        closing: true,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });

    expect(result.result.current).toBe(false);

    result.unmount();
  });

  it('restores the previous blacklist when the top blacklist registration disappears', () => {
    const { rerender } = render(
      <>
        <BlacklistRegistrar hostNames={['overlay-header']} />
        <BlacklistProbe />
      </>,
    );

    expect(screen.getByTestId('blacklist-state')).toHaveTextContent('overlay-header');

    rerender(
      <>
        <BlacklistRegistrar hostNames={['overlay-header']} />
        <BlacklistRegistrar hostNames={['overlay-composer']} />
        <BlacklistProbe />
      </>,
    );

    expect(screen.getByTestId('blacklist-state')).toHaveTextContent('overlay-composer');

    rerender(
      <>
        <BlacklistRegistrar hostNames={['overlay-header']} />
        <BlacklistRegistrar enabled={false} hostNames={['overlay-composer']} />
        <BlacklistProbe />
      </>,
    );

    expect(screen.getByTestId('blacklist-state')).toHaveTextContent('overlay-header');

    rerender(<BlacklistProbe />);

    expect(screen.getByTestId('blacklist-state')).toHaveTextContent('empty');
  });

  it('prevents teleporting blacklisted hosts even when they are top of stack and closing', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <>
        <BlacklistRegistrar hostNames={['overlay-composer']} />
        {children}
      </>
    );

    const blocked = renderHook(
      () => useShouldTeleportToClosingPortal('overlay-composer', 'blocked'),
      { wrapper },
    );
    const allowed = renderHook(
      () => useShouldTeleportToClosingPortal('overlay-header', 'allowed'),
      {
        wrapper,
      },
    );

    rememberLayout('overlay-composer', 'blocked');
    rememberLayout('overlay-header', 'allowed', { ...BASE_RECT, x: 90, y: 120 });

    act(() => {
      openOverlay('message-1');
      closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(blocked.result.current).toBe(false);
    expect(allowed.result.current).toBe(true);

    blocked.unmount();
    allowed.unmount();
  });
});
