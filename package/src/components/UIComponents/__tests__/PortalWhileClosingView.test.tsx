jest.mock('react-native-teleport', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  return {
    Portal: ({
      children,
      hostName,
      name,
    }: {
      children: React.ReactNode;
      hostName?: string;
      name: string;
    }) => (
      <View testID={`portal-${name}`}>
        <Text testID={`portal-${name}-host`}>{hostName ?? 'none'}</Text>
        {children}
      </View>
    ),
    PortalHost: ({ name }: { name: string }) => <Text testID={`portal-host-${name}`}>{name}</Text>,
    PortalProvider: View,
    usePortal: jest.fn().mockReturnValue({ removePortal: jest.fn() }),
  };
});

jest.mock('../../../state-store/message-overlay-store', () => ({
  clearClosingPortalLayout: jest.fn(),
  createClosingPortalLayoutRegistrationId: jest.fn(),
  setClosingPortalLayout: jest.fn(),
  useShouldTeleportToClosingPortal: jest.fn(),
}));

jest.mock('../../../state-store', () => {
  const mockedMessageOverlayStore = jest.requireMock('../../../state-store/message-overlay-store');

  return {
    ...mockedMessageOverlayStore,
  };
});

import React from 'react';
import { Text } from 'react-native';

import { act, cleanup, render, screen } from '@testing-library/react-native';

import * as stateStore from '../../../state-store/message-overlay-store';
import { PortalWhileClosingView } from '../PortalWhileClosingView';

const mockedCreateClosingPortalLayoutRegistrationId =
  stateStore.createClosingPortalLayoutRegistrationId as jest.Mock;
const mockedClearClosingPortalLayout = stateStore.clearClosingPortalLayout as jest.Mock;
const mockedUseShouldTeleportToClosingPortal =
  stateStore.useShouldTeleportToClosingPortal as jest.Mock;

describe('PortalWhileClosingView', () => {
  beforeEach(() => {
    mockedClearClosingPortalLayout.mockClear();
    mockedUseShouldTeleportToClosingPortal.mockReset();
    mockedUseShouldTeleportToClosingPortal.mockReturnValue(false);
    mockedCreateClosingPortalLayoutRegistrationId.mockReset();
    mockedCreateClosingPortalLayoutRegistrationId
      .mockReturnValueOnce('registration-1')
      .mockReturnValueOnce('registration-2')
      .mockReturnValue('registration-fallback');
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps content local when the teleport hook returns false', () => {
    render(
      <PortalWhileClosingView portalHostName='overlay-composer' portalName='local-portal'>
        <Text>Local</Text>
      </PortalWhileClosingView>,
    );

    expect(screen.getByTestId('portal-local-portal-host')).toHaveTextContent('none');
  });

  it('teleports content to the closing host when the teleport hook returns true', () => {
    mockedUseShouldTeleportToClosingPortal.mockReturnValue(true);

    render(
      <PortalWhileClosingView portalHostName='overlay-composer' portalName='teleported-portal'>
        <Text>Teleported</Text>
      </PortalWhileClosingView>,
    );

    expect(screen.getByTestId('portal-teleported-portal-host')).toHaveTextContent(
      'overlay-composer',
    );
  });

  it('clears its registered layout entry when it unmounts', () => {
    const { unmount } = render(
      <PortalWhileClosingView portalHostName='overlay-composer' portalName='cleanup-portal'>
        <Text>Cleanup</Text>
      </PortalWhileClosingView>,
    );

    act(() => {
      unmount();
    });

    expect(mockedClearClosingPortalLayout).toHaveBeenCalledWith(
      'overlay-composer',
      'registration-1',
    );
  });
});
