/* eslint no-underscore-dangle: 0 -- `_setStatus` is the SDK's own hook for faking socket status
   in tests; there is no public setter because only the socket itself should write it. */
import React, { PropsWithChildren } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { StreamChat } from 'stream-chat';

import { getTestClient, getTestClientWithUser } from '../../../../mock-builders/mock';
import { Chat } from '../../Chat';
import { useNetworkConnectionState } from '../useNetworkConnectionState';
import { useSettledWSConnectionHealth, useWSConnectionState } from '../useWSConnectionState';

/**
 * The socket is `isHealthy`, the device is `isOnline`. Two names for two facts, which is the reason
 * these are two hooks and not one combined "connected" boolean — and the reason the socket's guard is
 * `!isHealthy` while the network's has to be `=== false`.
 */
describe('connection state hooks', () => {
  let client: StreamChat;

  const wrapper = ({ children }: PropsWithChildren) => <Chat client={client}>{children}</Chat>;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'me' });
  });

  describe('useWSConnectionState', () => {
    it('reads the current status on mount, not only on the next transition', async () => {
      // The regression this replaces: driving state off a `connection.changed` event meant a client
      // that was already down rendered as online until something changed.
      client.wsConnection._setStatus({ isHealthy: false });

      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isHealthy).toBe(false));
    });

    it('follows the socket up and down', async () => {
      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isHealthy).toBe(true));

      act(() => {
        client.wsConnection._setStatus({ isHealthy: false });
      });
      expect(result.current?.isHealthy).toBe(false);
      expect(result.current?.lastUnhealthyAt).toBeInstanceOf(Date);

      act(() => {
        client.wsConnection._setStatus({ isHealthy: true });
      });
      expect(result.current?.isHealthy).toBe(true);
      expect(result.current?.lastHealthyAt).toBeInstanceOf(Date);
    });

    it('is not moved by the device network going down', async () => {
      // The guard that matters. The two used to share one event and be told apart by a discriminator;
      // now they are separate stores, and this is what proves nothing derives one from the other.
      const { result } = renderHook(() => useWSConnectionState(), { wrapper });

      await waitFor(() => expect(result.current?.isHealthy).toBe(true));

      act(() => {
        client.networkConnection.setStatus(false);
      });

      expect(result.current?.isHealthy).toBe(true);
    });
  });

  describe('useSettledWSConnectionHealth', () => {
    beforeEach(() => {
      client.config.set({
        client: { wsConnection: { offlineNotificationDisplayDelayMs: 5000 } },
      });
    });

    it('holds a drop back for the configured delay', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => useSettledWSConnectionHealth(), { wrapper });

      await waitFor(() => expect(result.current).toBe(true));

      act(() => {
        client.wsConnection._setStatus({ isHealthy: false });
      });
      // Still reads healthy: this is the flap the delay exists to swallow.
      expect(result.current).toBe(true);

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(result.current).toBe(false);

      jest.useRealTimers();
    });

    it('never reports a drop the socket already recovered from', async () => {
      // The bug that retiring the client-side timer was meant to end: a timer armed by a socket that
      // has since been replaced announcing a drop over a working connection.
      jest.useFakeTimers();

      const { result } = renderHook(() => useSettledWSConnectionHealth(), { wrapper });

      await waitFor(() => expect(result.current).toBe(true));

      act(() => {
        client.wsConnection._setStatus({ isHealthy: false });
      });
      act(() => {
        jest.advanceTimersByTime(4000);
      });
      act(() => {
        client.wsConnection._setStatus({ isHealthy: true });
      });
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current).toBe(true);

      jest.useRealTimers();
    });

    it('reports recovery immediately', async () => {
      jest.useFakeTimers();

      client.wsConnection._setStatus({ isHealthy: false });

      const { result } = renderHook(() => useSettledWSConnectionHealth(), { wrapper });

      // Already down when it mounted, so there is no flap to wait out.
      await waitFor(() => expect(result.current).toBe(false));

      act(() => {
        client.wsConnection._setStatus({ isHealthy: true });
      });
      expect(result.current).toBe(true);

      jest.useRealTimers();
    });

    it('holds nothing back when the delay is zero', async () => {
      client.config.set({
        client: { wsConnection: { offlineNotificationDisplayDelayMs: 0 } },
      });

      const { result } = renderHook(() => useSettledWSConnectionHealth(), { wrapper });

      await waitFor(() => expect(result.current).toBe(true));

      act(() => {
        client.wsConnection._setStatus({ isHealthy: false });
      });
      expect(result.current).toBe(false);
    });
  });

  describe('useNetworkConnectionState', () => {
    it('is unknown until something reports, so a guard cannot read it as offline', async () => {
      // `undefined`, not `false`. A guard written as `!isOnline` would render an offline banner on
      // an unreported network and never clear it — which is why every consumer tests `=== false`.
      // An unconnected client has had nothing to report, not even the socket fallback below.
      client = getTestClient();

      const { result } = renderHook(() => useNetworkConnectionState(), { wrapper });

      await waitFor(() => expect(result.current).toBeDefined());
      expect(result.current?.isOnline).toBeUndefined();
    });

    it('mirrors the socket until a real reporter is installed', () => {
      // Not what we want, but what the client does: outside a browser it falls back to a reporter
      // that mirrors its own WebSocket, and `<Chat>` can only install the NetInfo one from an
      // effect. `client` here is connected before anything renders, so the fallback has already
      // written the DEVICE store from the SOCKET — the mis-blame the split exists to avoid.
      //
      // Install `netInfoStatusReporter` at client construction to close the window. This is pinned
      // so that if the client ever stops fabricating the value, we notice here rather than in an app.
      expect(client.networkConnection.isOnline).toBe(true);

      act(() => {
        client.wsConnection._setStatus({ isHealthy: false });
      });

      expect(client.networkConnection.isOnline).toBe(false);
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
        client.wsConnection._setStatus({ isHealthy: false });
      });

      expect(result.current?.isOnline).toBe(true);
    });
  });
});
