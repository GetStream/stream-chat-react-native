jest.mock('../../../state-store', () => {
  const actual = jest.requireActual('../../../state-store');
  const createClosingPortalLayoutRegistrationId = jest.fn(() => 'registration-1');

  return new Proxy(actual, {
    get(target, prop, receiver) {
      if (prop === 'createClosingPortalLayoutRegistrationId') {
        return createClosingPortalLayoutRegistrationId;
      }

      return Reflect.get(target, prop, receiver);
    },
  });
});

import React from 'react';
import { Text } from 'react-native';

import { act, cleanup, render, screen } from '@testing-library/react-native';

import * as stateStore from '../../../state-store';
import { PortalWhileClosingView } from '../PortalWhileClosingView';

const BASE_RECT = { h: 48, w: 120, x: 12, y: 24 };

const flushAnimationFrameQueue = () => {
  act(() => {
    jest.runAllTimers();
  });
};

const TeleportStateProbe = ({
  hostName,
  id,
  testID,
}: {
  hostName: string;
  id: string;
  testID: string;
}) => {
  const shouldTeleport = stateStore.useShouldTeleportToClosingPortal(hostName, id);

  return <Text testID={testID}>{shouldTeleport ? 'true' : 'false'}</Text>;
};

const BlacklistRegistrar = ({ hostNames }: { hostNames: string[] }) => {
  stateStore.useClosingPortalHostBlacklist(hostNames);
  return null;
};

const findPortalNode = (
  node: ReturnType<ReturnType<typeof render>['toJSON']>,
  portalName: string,
): null | { props?: { hostName?: string; name?: string } } => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findPortalNode(child, portalName);
      if (found) {
        return found;
      }
    }

    return null;
  }

  if (node.props?.name === portalName) {
    return node;
  }

  for (const child of node.children ?? []) {
    if (typeof child === 'string') {
      continue;
    }

    const found = findPortalNode(child, portalName);
    if (found) {
      return found;
    }
  }

  return null;
};

describe('PortalWhileClosingView', () => {
  beforeEach(() => {
    jest.useFakeTimers();

    act(() => {
      stateStore.finalizeCloseOverlay();
      stateStore.overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
      });
    });
  });

  afterEach(() => {
    cleanup();

    act(() => {
      stateStore.clearClosingPortalLayout('overlay-composer', 'registration-1');
      stateStore.finalizeCloseOverlay();
      stateStore.overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
      });
    });

    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('uses the real store to teleport once the overlay is closing and this host is active', () => {
    const { toJSON } = render(
      <>
        <PortalWhileClosingView portalHostName='overlay-composer' portalName='composer-portal'>
          <Text>Composer</Text>
        </PortalWhileClosingView>
        <TeleportStateProbe
          hostName='overlay-composer'
          id='registration-1'
          testID='teleport-state'
        />
      </>,
    );

    act(() => {
      stateStore.setClosingPortalLayout('overlay-composer', 'registration-1', BASE_RECT);
    });

    expect(screen.getByTestId('teleport-state')).toHaveTextContent('false');
    expect(findPortalNode(toJSON(), 'composer-portal')?.props?.hostName).toBeUndefined();

    act(() => {
      stateStore.openOverlay('message-1');
      stateStore.closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(screen.getByTestId('teleport-state')).toHaveTextContent('true');
    expect(findPortalNode(toJSON(), 'composer-portal')?.props?.hostName).toBe('overlay-composer');
  });

  it('keeps the portal local when the host is blacklisted', () => {
    const { toJSON } = render(
      <>
        <BlacklistRegistrar hostNames={['overlay-composer']} />
        <PortalWhileClosingView portalHostName='overlay-composer' portalName='composer-portal'>
          <Text>Composer</Text>
        </PortalWhileClosingView>
        <TeleportStateProbe
          hostName='overlay-composer'
          id='registration-1'
          testID='teleport-state'
        />
      </>,
    );

    act(() => {
      stateStore.setClosingPortalLayout('overlay-composer', 'registration-1', BASE_RECT);
      stateStore.openOverlay('message-1');
      stateStore.closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(screen.getByTestId('teleport-state')).toHaveTextContent('false');
    expect(findPortalNode(toJSON(), 'composer-portal')?.props?.hostName).toBeUndefined();
  });

  it('clears its registration from the real store when it unmounts', () => {
    const { rerender } = render(
      <>
        <PortalWhileClosingView portalHostName='overlay-composer' portalName='composer-portal'>
          <Text>Composer</Text>
        </PortalWhileClosingView>
        <TeleportStateProbe
          hostName='overlay-composer'
          id='registration-1'
          testID='teleport-state'
        />
      </>,
    );

    act(() => {
      stateStore.setClosingPortalLayout('overlay-composer', 'registration-1', BASE_RECT);
      stateStore.openOverlay('message-1');
      stateStore.closeOverlay();
    });
    flushAnimationFrameQueue();

    expect(screen.getByTestId('teleport-state')).toHaveTextContent('true');

    rerender(
      <TeleportStateProbe
        hostName='overlay-composer'
        id='registration-1'
        testID='teleport-state'
      />,
    );

    expect(screen.getByTestId('teleport-state')).toHaveTextContent('false');
  });
});
