import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { GetApplicationResponse, StreamChat } from 'stream-chat';

import { useAppSettingsGetter } from '../useAppSettingsGetter';

const fetched = { app: { name: 'fetched' } } as unknown as GetApplicationResponse;
const stored = { app: { name: 'stored' } } as unknown as GetApplicationResponse;

const makeClient = () => {
  const offlineDb = {
    executeQuerySafely: jest.fn(),
    getAppSettings: jest.fn().mockResolvedValue(stored),
  };
  const client = { getAppSettings: jest.fn().mockResolvedValue(fetched), offlineDb };
  return { client, offlineDb };
};

const render = (client: unknown, props: { ready?: boolean; userId?: string } = {}) =>
  renderHook(
    ({ ready, userId }: { ready: boolean; userId: string | undefined }) =>
      useAppSettingsGetter({ client: client as StreamChat, ready, userId }),
    { initialProps: { ready: props.ready ?? true, userId: props.userId ?? 'me' } },
  );

describe('useAppSettingsGetter', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('requests the settings once a user is connected and reuses them for every call', async () => {
    const { client, offlineDb } = makeClient();
    const { result } = render(client);

    await act(async () => {
      await expect(result.current()).resolves.toBe(fetched);
      await expect(result.current()).resolves.toBe(fetched);
    });

    expect(client.getAppSettings).toHaveBeenCalledTimes(1);
    expect(offlineDb.executeQuerySafely).toHaveBeenCalledTimes(1);
  });

  it('does not request them before it is ready', async () => {
    const { client } = makeClient();
    const { rerender } = render(client, { ready: false });
    await act(() => Promise.resolve());
    expect(client.getAppSettings).not.toHaveBeenCalled();

    rerender({ ready: true, userId: 'me' });
    await act(() => Promise.resolve());
    expect(client.getAppSettings).toHaveBeenCalledTimes(1);
  });

  it('falls back to the offline copy when the request fails, and fetches again next time', async () => {
    const { client } = makeClient();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    client.getAppSettings.mockRejectedValueOnce(new Error('network'));
    const { result } = render(client, { ready: false });

    await act(async () => {
      await expect(result.current()).resolves.toBe(stored);
      await expect(result.current()).resolves.toBe(fetched);
    });
    expect(client.getAppSettings).toHaveBeenCalledTimes(2);
  });

  it('rejects when the request fails and there is no offline copy', async () => {
    const { client, offlineDb } = makeClient();
    offlineDb.getAppSettings.mockResolvedValue(null);
    client.getAppSettings.mockRejectedValueOnce(new Error('network'));
    const { result } = render(client, { ready: false });

    await act(async () => {
      await expect(result.current()).rejects.toThrow('network');
    });
  });

  it('fetches again for a different user, so their offline copy is written too', async () => {
    const { client, offlineDb } = makeClient();
    const { rerender, result } = render(client);
    await act(async () => {
      await result.current();
    });

    rerender({ ready: true, userId: 'someone-else' });
    await act(async () => {
      await result.current();
    });

    expect(client.getAppSettings).toHaveBeenCalledTimes(2);
    expect(offlineDb.executeQuerySafely).toHaveBeenCalledTimes(2);
  });

  it('keeps the same function across renders', () => {
    const { client } = makeClient();
    const { rerender, result } = render(client, { ready: false });
    const first = result.current;

    rerender({ ready: true, userId: 'me' });

    expect(result.current).toBe(first);
  });
});
