import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { sqliteMock } from '../../../mock-builders/DB/mock';
import dispatchConnectionChangedEvent from '../../../mock-builders/event/connectionChanged';
import dispatchConnectionRecoveredEvent from '../../../mock-builders/event/connectionRecovered';
import { getTestClient, getTestClientWithUser, setUser } from '../../../mock-builders/mock';
import { DEFAULT_MAX_SYNC_EVENTS_LIMIT } from '../../../store/constants';
import { SqliteClient, SqliteClientError } from '../../../store/SqliteClient';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { Chat } from '../Chat';

const ChatContextConsumer = ({ fn }: { fn: (ctx: ChatContextValue) => void }) => {
  fn(useChatContext());
  return <View testID='children' />;
};

const TranslationContextConsumer = ({ fn }: { fn: (ctx: TranslationContextValue) => void }) => {
  fn(useTranslationContext());
  return <View testID='children' />;
};

describe('Chat', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });
  const chatClient = getTestClient();

  it('renders children without crashing', async () => {
    const { getByTestId } = render(
      <Chat client={chatClient}>
        <View testID='children' />
      </Chat>,
    );

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
  });

  it('listens and updates state on a connection changed event', async () => {
    let context: ChatContextValue = {} as ChatContextValue;

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    await waitFor(() => expect(NetInfo.fetch).toHaveBeenCalledTimes(1));

    const { connectionRecovering } = context;
    act(() => dispatchConnectionChangedEvent(chatClient, false));
    await waitFor(() => {
      expect(context.connectionRecovering).toStrictEqual(!connectionRecovering);
      expect(context.isOnline).toBeFalsy();
    });
  });

  it('listens and updates state on a connection recovered event', async () => {
    let context: ChatContextValue = {} as ChatContextValue;

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    act(() => dispatchConnectionRecoveredEvent(chatClient));

    await waitFor(() => expect(context.connectionRecovering).toStrictEqual(false));
  });
});

describe('ChatContext', () => {
  afterEach(cleanup);
  const chatClient = getTestClient();
  it('exposes the chat context', async () => {
    let context: ChatContextValue = {} as ChatContextValue;

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(context).toBeInstanceOf(Object);
      expect(context.channel).toBeUndefined();
      expect(context.client).toBe(chatClient);
      expect(context.connectionRecovering).toBeFalsy();
      expect(context.setActiveChannel).toBeInstanceOf(Function);
    });
  });

  it('calls setActiveChannel to set a new channel in context', async () => {
    let context: ChatContextValue = {} as ChatContextValue;

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    const channel = { cid: 'cid', id: 'cid', query: jest.fn() };

    await waitFor(() => expect(context.channel).toBeUndefined());
    act(() =>
      context.setActiveChannel(
        channel as unknown as Parameters<typeof context.setActiveChannel>[0],
      ),
    );

    await waitFor(() => expect(context.channel).toStrictEqual(channel));
  });
});

describe('TranslationContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const chatClient = getTestClient();
  it('exposes the translation context', async () => {
    let context: TranslationContextValue = {} as TranslationContextValue;

    render(
      <Chat client={chatClient}>
        <TranslationContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(context).toBeInstanceOf(Object);
      expect(context.t).toBeInstanceOf(Function);
      expect(context.tDateTimeParser).toBeInstanceOf(Function);
    });
  });

  it('uses the i18nInstance provided in props', async () => {
    let context: TranslationContextValue = {} as TranslationContextValue;
    const i18nInstance = new Streami18n();
    const { t, tDateTimeParser } = await i18nInstance.getTranslators();

    i18nInstance.t = (() => 't') as typeof i18nInstance.t;
    i18nInstance.tDateTimeParser = (() => 'tDateTimeParser') as typeof i18nInstance.tDateTimeParser;

    render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <TranslationContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(context.t).not.toBe(t);
      expect(context.t).toBe(i18nInstance.t);
      expect(context.tDateTimeParser).not.toBe(tDateTimeParser);
      expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
    });
  });

  it('updates the context when props change', async () => {
    let context: TranslationContextValue = {} as TranslationContextValue;
    const i18nInstance = new Streami18n();

    i18nInstance.t = (() => 't') as typeof i18nInstance.t;
    i18nInstance.tDateTimeParser = (() => 'tDateTimeParser') as typeof i18nInstance.tDateTimeParser;

    const { rerender } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <TranslationContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(context.t).toBe(i18nInstance.t);
      expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
    });

    const newI18nInstance = new Streami18n();

    newI18nInstance.t = (() => 'newT') as typeof newI18nInstance.t;
    newI18nInstance.tDateTimeParser = (() =>
      'newtDateTimeParser') as typeof newI18nInstance.tDateTimeParser;

    rerender(
      <Chat client={chatClient} i18nInstance={newI18nInstance}>
        <TranslationContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );
    await waitFor(() => {
      expect(context.t).not.toBe(i18nInstance.t);
      expect(context.t).toBe(newI18nInstance.t);
      expect(context.tDateTimeParser).not.toBe(i18nInstance.tDateTimeParser);
      expect(context.tDateTimeParser).toBe(newI18nInstance.tDateTimeParser);
    });
  });

  it('makes sure DBSyncManager listeners are cleaned up after Chat remount', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });

    // initial mount and render
    const { rerender } = render(<Chat client={chatClientWithUser} enableOfflineSupport key={1} />);

    let unsubscribeSpy: jest.SpyInstance | undefined;
    let listenersAfterInitialMount: Array<unknown> = [];
    const initSpy = jest.spyOn(chatClientWithUser.offlineDb!.syncManager, 'init');

    await waitFor(() => {
      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      unsubscribeSpy = jest.spyOn(
        chatClientWithUser.offlineDb!.syncManager.connectionChangedListener as object,
        'unsubscribe' as never,
      );
      listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];
    });

    // remount
    rerender(<Chat client={chatClientWithUser} enableOfflineSupport key={2} />);

    await waitFor(() => {
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
      expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
        listenersAfterInitialMount.length,
      );
    });
  });

  it('makes sure DBSyncManager listeners are cleaned up if the user changes', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID1' });

    // initial render
    const { rerender } = render(<Chat client={chatClientWithUser} enableOfflineSupport />);

    let unsubscribeSpy: jest.SpyInstance | undefined;
    let listenersAfterInitialMount: Array<unknown> = [];
    const initSpy = jest.spyOn(chatClientWithUser.offlineDb!.syncManager, 'init');

    await waitFor(() => {
      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      unsubscribeSpy = jest.spyOn(
        chatClientWithUser.offlineDb!.syncManager.connectionChangedListener as object,
        'unsubscribe' as never,
      );
      listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];
    });

    await act(async () => {
      await setUser(chatClientWithUser, { id: 'testID2' });
    });

    // rerender with different user ID
    rerender(<Chat client={chatClientWithUser} enableOfflineSupport />);

    await waitFor(() => {
      expect(initSpy).toHaveBeenCalledTimes(2);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
      expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
        listenersAfterInitialMount.length,
      );
    });
  });

  it('makes sure DBSyncManager state stays intact during normal rerenders', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });

    // initial render
    const { rerender } = render(<Chat client={chatClientWithUser} enableOfflineSupport />);

    let unsubscribeSpy: jest.SpyInstance | undefined;
    const initSpy = jest.spyOn(chatClientWithUser.offlineDb!.syncManager, 'init');

    await waitFor(() => {
      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      unsubscribeSpy = jest.spyOn(
        chatClientWithUser.offlineDb!.syncManager.connectionChangedListener as object,
        'unsubscribe' as never,
      );
    });

    const listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];

    // rerender
    rerender(<Chat client={chatClientWithUser} enableOfflineSupport />);

    await waitFor(() => {
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
      expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
        listenersAfterInitialMount.length,
      );
    });
  });

  it('forwards maxSyncEventsLimit to the offline DB sync manager', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });

    render(<Chat client={chatClientWithUser} enableOfflineSupport maxSyncEventsLimit={42} />);

    await waitFor(() => {
      expect(chatClientWithUser.offlineDb).toBeDefined();
    });
    expect(chatClientWithUser.offlineDb!.syncManager.syncMaxEventCount).toBe(42);
  });

  it('defaults maxSyncEventsLimit to 250 when not provided', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });

    render(<Chat client={chatClientWithUser} enableOfflineSupport />);

    await waitFor(() => {
      expect(chatClientWithUser.offlineDb).toBeDefined();
    });
    expect(chatClientWithUser.offlineDb!.syncManager.syncMaxEventCount).toBe(
      DEFAULT_MAX_SYNC_EVENTS_LIMIT,
    );
    expect(DEFAULT_MAX_SYNC_EVENTS_LIMIT).toBe(250);
  });

  it('disables the sync event limit when maxSyncEventsLimit is false', async () => {
    const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });

    render(<Chat client={chatClientWithUser} enableOfflineSupport maxSyncEventsLimit={false} />);

    await waitFor(() => {
      expect(chatClientWithUser.offlineDb).toBeDefined();
    });
    // `false` opts out: the client stores no limit (undefined), so replay always runs.
    expect(chatClientWithUser.offlineDb!.syncManager.syncMaxEventCount).toBeUndefined();
  });
});

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

  it('forwards getEncryptionKey to the sqlite client', async () => {
    const chatClientWithUser = await createClient();
    const getEncryptionKey = jest.fn().mockResolvedValue('a-stable-key');

    render(
      <Chat client={chatClientWithUser} enableOfflineSupport getEncryptionKey={getEncryptionKey} />,
    );

    await waitFor(() => expect(chatClientWithUser.offlineDb).toBeDefined());
    await waitFor(() => expect(getEncryptionKey).toHaveBeenCalled());
  });

  it('does not re-initialize when getEncryptionKey is a new function every render', async () => {
    const chatClientWithUser = await createClient();
    const resolveKey = jest.fn().mockResolvedValue('a-stable-key');

    // An inline arrow is the shape integrators reach for first, so a changing
    // identity must not restart initialization on every render.
    const { rerender } = render(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getEncryptionKey={() => resolveKey()}
      />,
    );

    await waitFor(() => expect(chatClientWithUser.offlineDb).toBeDefined());
    const initSpy = track(jest.spyOn(chatClientWithUser.offlineDb!, 'init'));

    rerender(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getEncryptionKey={() => resolveKey()}
      />,
    );
    rerender(
      <Chat
        client={chatClientWithUser}
        enableOfflineSupport
        getEncryptionKey={() => resolveKey()}
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
        <Chat client={chatClientWithUser} enableOfflineSupport getEncryptionKey={getKey}>
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
          getEncryptionKey={() => Promise.resolve('a-stable-key')}
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
          getEncryptionKey={() => Promise.resolve('a-stable-key')}
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
          getEncryptionKey={() => Promise.resolve(undefined)}
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
          getEncryptionKey={() => Promise.resolve('a-stable-key')}
        >
          <View testID='children' />
        </Chat>
      </Boundary>,
    );

    await waitFor(() => expect(getByTestId('children')).toBeTruthy());
    expect(onCatch).not.toHaveBeenCalled();
  });
});
