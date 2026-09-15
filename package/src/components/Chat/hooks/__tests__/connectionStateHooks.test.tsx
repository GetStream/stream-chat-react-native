/* eslint no-underscore-dangle: 0 -- `_setStatus` is the SDK's own hook for faking socket status
   in tests; there is no public setter because only the socket itself should write it. */
import React, { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { StreamChat } from 'stream-chat';

import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Chat } from '../../Chat';
import { useNetworkConnectionState } from '../useNetworkConnectionState';
import { useWSConnectionState } from '../useWSConnectionState';

/**
 * Both stores expose `isOnline` and they mean different things, so every consumer here aliases them.
 * That ambiguity is the reason these are two hooks and not one combined "connected" boolean.
 */
describe('connection state hooks', () => {
  let client: StreamChat;

  const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
  });

  describe('useWSConnectionState', () => {
    it('reads the current status on mount, not only on the next transition', async () => {
      // The regression this replaces: driving state off `connection.changed` meant a client that was
      // already down rendered as online until something changed.
      client.wsConnection._setStatus({ isOnline: false });

      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isOnline).toBe(false));
    });

    it('follows the socket up and down', async () => {
      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isOnline).toBe(true));

      act(() => {
        client.wsConnection._setStatus({ isOnline: false });
      });
      expect(result.current?.isOnline).toBe(false);

      act(() => {
        client.wsConnection._setStatus({ isOnline: true, connectionId: 'reconnected' });
      });
      expect(result.current?.isOnline).toBe(true);
      expect(result.current?.connectionId).toBe('reconnected');
    });

    it('is not moved by the device network going down', async () => {
      // The guard that matters. Both facts dispatch `connection.changed` with the same payload
      // shape, so nothing but the `connection` discriminator keeps them apart.
      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isOnline).toBe(true));

      act(() => {
        client.networkConnection.setStatus(false);
      });

      expect(result.current?.isOnline).toBe(true);
    });
  });

  describe('useNetworkConnectionState', () => {
    it('starts unknown rather than assuming offline', async () => {
      // `undefined`, not `false`. A guard written as `!isOnline` would render an offline banner here
      // and never clear it — which is why every consumer tests `=== false`.
      const { result } = renderHook(() => useNetworkConnectionState(), { wrapper });

      await waitFor(() => expect(result.current).toBeDefined());
      expect(result.current?.isOnline).toBeUndefined();
    });

    it('follows the device network and stamps the matching timestamp', async () => {
      const { result } = renderHook(() => useNetworkConnectionState(), { wrapper });

      await waitFor(() => expect(result.current).toBeDefined());

      act(() => {
        client.networkConnection.setStatus(false);
      });
      expect(result.current?.isOnline).toBe(false);
      expect(result.current?.lastOfflineAt).toBeInstanceOf(Date);

      act(() => {
        client.networkConnection.setStatus(true);
      });
      expect(result.current?.isOnline).toBe(true);
      expect(result.current?.lastOnlineAt).toBeInstanceOf(Date);
    });

    it('is not moved by the socket dropping on a working network', async () => {
      const { result } = renderHook(() => useNetworkConnectionState(), { wrapper });

      await waitFor(() => expect(result.current).toBeDefined());

      act(() => {
        client.networkConnection.setStatus(true);
      });
      act(() => {
        client.wsConnection._setStatus({ isOnline: false });
      });

      expect(result.current?.isOnline).toBe(true);
    });
  });
});
