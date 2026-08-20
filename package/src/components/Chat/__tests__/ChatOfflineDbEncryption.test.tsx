import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { sqliteMock } from '../../../mock-builders/DB/mock';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { SqliteClient, SqliteClientError } from '../../../store/SqliteClient';
import { Chat } from '../Chat';

describe('Chat offline DB encryption', () => {
  const installedSpies: jest.SpyInstance[] = [];

  /**
   * Registers a spy for teardown. Deliberately not jest.restoreAllMocks(): that also
   * restores the connection privates mockClient() stubs out on every client created
   * by earlier tests in this file, after which those clients reconnect for real and
   * the failed websocket handshake resurfaces as an unhandled error somewhere else.
   */
  const track = <T extends jest.SpyInstance>(spy: T): T => {
    installedSpies.push(spy);
    return spy;
  };

  /**
   * Chat mounts useIsOnline, which opens the websocket whenever the app comes to the
   * foreground. Left real, that connection attempt outlives the test and rejects
   * asynchronously. Nothing in this block needs a connection.
   */
  const createClient = async () => {
    const client = await getTestClientWithUser({ id: 'testID' });
    track(jest.spyOn(client, 'openConnection').mockResolvedValue(undefined));
    track(jest.spyOn(client, 'closeConnection').mockResolvedValue(undefined));
    return client;
  };

  /** Minimal error boundary, since `<Chat>` reports encryption failures by throwing. */
  class Boundary extends React.Component<
    PropsWithChildren<{ onCatch: (error: Error) => void }>,
    { caught: boolean }
  > {
    state = { caught: false };

    static getDerivedStateFromError() {
      return { caught: true };
    }

    componentDidCatch(error: Error) {
      this.props.onCatch(error);
    }

    render() {
      return this.state.caught ? <View testID='boundary' /> : this.props.children;
    }
  }

  afterEach(() => {
    cleanup();
    installedSpies.splice(0).forEach((spy) => spy.mockRestore());
    SqliteClient.getEncryptionKey = undefined;
  });

  it('does not configure an encryption key when the prop is omitted', async () => {
    const chatClientWithUser = await createClient();

    render(<Chat client={chatClientWithUser} enableOfflineSupport />);

    await waitFor(() => expect(chatClientWithUser.offlineDb).toBeDefined());
    expect(SqliteClient.getEncryptionKey).toBeUndefined();
  });

  it('forwards getOfflineDbEncryptionKey to the sqlite client', async () => {
    const chatClientWithUser = await createClient();
    const getOfflineDbEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');

    render(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getOfflineDbEncryptionKey={getOfflineDbEncryptionKey}
      />,
    );

    await waitFor(() => expect(chatClientWithUser.offlineDb).toBeDefined());
    await waitFor(() => expect(getOfflineDbEncryptionKey).toHaveBeenCalled());
  });

  it('does not re-initialize when getOfflineDbEncryptionKey is a new function every render', async () => {
    const chatClientWithUser = await createClient();
    const resolveKey = jest.fn().mockResolvedValue('a-stable-key');

    // An inline arrow is the shape integrators reach for first, so a changing
    // identity must not restart initialization on every render.
    const { rerender } = render(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getOfflineDbEncryptionKey={() => resolveKey()}
      />,
    );

    await waitFor(() => expect(chatClientWithUser.offlineDb).toBeDefined());
    const initSpy = track(jest.spyOn(chatClientWithUser.offlineDb!, 'init'));

    rerender(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getOfflineDbEncryptionKey={() => resolveKey()}
      />,
    );
    rerender(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getOfflineDbEncryptionKey={() => resolveKey()}
      />,
    );

    await waitFor(() => expect(initSpy).not.toHaveBeenCalled());
  });

  it.each<[string, () => Promise<string | undefined>, string]>([
    ['the key cannot be read', () => Promise.resolve(undefined), 'ENCRYPTION_KEY_UNAVAILABLE'],
    [
      'the key getter throws',
      () => Promise.reject(new Error('keychain is locked')),
      'ENCRYPTION_KEY_UNAVAILABLE',
    ],
  ])('throws %s so an error boundary can decide', async (_label, getKey, code) => {
    const chatClientWithUser = await createClient();
    track(jest.spyOn(console, 'warn').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'error').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'log').mockImplementation(() => undefined));
    const onCatch = jest.fn();

    const { getByTestId } = render(
      <Boundary onCatch={onCatch}>
        <Chat client={chatClientWithUser} enableOfflineSupport getOfflineDbEncryptionKey={getKey}>
          <View testID='children' />
        </Chat>
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('boundary')).toBeTruthy());
    expect(onCatch).toHaveBeenCalledWith(expect.any(SqliteClientError));
    expect((onCatch.mock.calls[0][0] as SqliteClientError).code).toBe(code);
    // Never silently downgraded to online-only.
    expect(() => getByTestId('children')).toThrow();
  });

  it('throws when the native build has no SQLCipher', async () => {
    const chatClientWithUser = await createClient();
    track(jest.spyOn(console, 'error').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'log').mockImplementation(() => undefined));
    track(jest.spyOn(sqliteMock, 'isSQLCipher').mockReturnValue(false));
    const onCatch = jest.fn();

    const { getByTestId } = render(
      <Boundary onCatch={onCatch}>
        <Chat
          client={chatClientWithUser}
          enableOfflineSupport
          getOfflineDbEncryptionKey={() => Promise.resolve('a-stable-key')}
        />
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('boundary')).toBeTruthy());
    expect((onCatch.mock.calls[0][0] as SqliteClientError).code).toBe('SQLCIPHER_BUILD_MISSING');
  });

  it('throws OFFLINE_DB_UNREADABLE without deleting the database', async () => {
    const chatClientWithUser = await createClient();
    track(jest.spyOn(console, 'warn').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'error').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'log').mockImplementation(() => undefined));
    // Preflight passes, then the first read of the file fails to decrypt.
    track(
      jest
        .spyOn(SqliteClient, 'getUserPragmaVersion')
        .mockRejectedValue(new Error('Querying for user_version failed: file is not a database')),
    );
    const deleteSpy = track(jest.spyOn(SqliteClient, 'deleteDatabase'));
    const onCatch = jest.fn();

    const { getByTestId } = render(
      <Boundary onCatch={onCatch}>
        <Chat
          client={chatClientWithUser}
          enableOfflineSupport
          getOfflineDbEncryptionKey={() => Promise.resolve('a-stable-key')}
        />
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('boundary')).toBeTruthy());
    expect((onCatch.mock.calls[0][0] as SqliteClientError).code).toBe('OFFLINE_DB_UNREADABLE');
    // Wiping is the integrator's decision, made from the boundary.
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('never attaches an offline DB it cannot open', async () => {
    const chatClientWithUser = await createClient();
    track(jest.spyOn(console, 'warn').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'error').mockImplementation(() => undefined));
    track(jest.spyOn(console, 'log').mockImplementation(() => undefined));
    const setOfflineDBApiSpy = track(jest.spyOn(chatClientWithUser, 'setOfflineDBApi'));

    const { getByTestId } = render(
      <Boundary onCatch={() => undefined}>
        <Chat
          client={chatClientWithUser}
          enableOfflineSupport
          getOfflineDbEncryptionKey={() => Promise.resolve(undefined)}
        />
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('boundary')).toBeTruthy());

    // Parts of the client write through `client.offlineDb` without checking that it
    // initialized - queryChannels upserts into it - so an instance we cannot open
    // would turn those writes into rejections.
    expect(setOfflineDBApiSpy).not.toHaveBeenCalled();
    expect(chatClientWithUser.offlineDb).toBeUndefined();
  });

  it('renders normally when nothing is wrong with encryption', async () => {
    const chatClientWithUser = await createClient();
    const onCatch = jest.fn();

    const { getByTestId } = render(
      <Boundary onCatch={onCatch}>
        <Chat
          client={chatClientWithUser}
          enableOfflineSupport
          getOfflineDbEncryptionKey={() => Promise.resolve('a-stable-key')}
        >
          <View testID='children' />
        </Chat>
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    expect(onCatch).not.toHaveBeenCalled();
  });
});
