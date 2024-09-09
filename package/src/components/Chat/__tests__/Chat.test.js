import React from 'react';
import { View } from 'react-native';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import { setNetInfoFetchMock } from '../../../../jest-setup';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import dispatchConnectionChangedEvent from '../../../mock-builders/event/connectionChanged';
import dispatchConnectionRecoveredEvent from '../../../mock-builders/event/connectionRecovered';
import { getTestClient, getTestClientWithUser, setUser } from '../../../mock-builders/mock';
import { DBSyncManager } from '../../../utils/DBSyncManager';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { Chat } from '../Chat';

const ChatContextConsumer = ({ fn }) => {
  fn(useChatContext());
  return <View testID='children' />;
};

const TranslationContextConsumer = ({ fn }) => {
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
    let context;
    const netInfoFetch = jest.fn();
    setNetInfoFetchMock(netInfoFetch);

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        ></ChatContextConsumer>
      </Chat>,
    );

    await waitFor(() => expect(netInfoFetch).toHaveBeenCalledTimes(1));

    const { connectionRecovering } = context;
    act(() => dispatchConnectionChangedEvent(chatClient, false));
    await waitFor(() => {
      expect(context.connectionRecovering).toStrictEqual(!connectionRecovering);
      expect(context.isOnline).toBeFalsy();
    });
  });

  it('listens and updates state on a connection recovered event', async () => {
    let context;

    render(
      <Chat client={chatClient}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        ></ChatContextConsumer>
      </Chat>,
    );

    act(() => dispatchConnectionRecoveredEvent(chatClient));

    await waitFor(() => expect(context.connectionRecovering).toStrictEqual(false));
  });

  describe('ChatContext', () => {
    it('exposes the chat context', async () => {
      let context;

      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></ChatContextConsumer>
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
      let context;

      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></ChatContextConsumer>
        </Chat>,
      );

      const channel = { cid: 'cid', id: 'cid', query: jest.fn() };

      await waitFor(() => expect(context.channel).toBeUndefined());
      act(() => context.setActiveChannel(channel));

      await waitFor(() => expect(context.channel).toStrictEqual(channel));
    });
  });

  describe('TranslationContext', () => {
    it('exposes the translation context', async () => {
      let context;

      render(
        <Chat client={chatClient}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></TranslationContextConsumer>
        </Chat>,
      );

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.t).toBeInstanceOf(Function);
        expect(context.tDateTimeParser).toBeInstanceOf(Function);
      });
    });

    it('uses the i18nInstance provided in props', async () => {
      let context;
      const i18nInstance = new Streami18n();
      const { t, tDateTimeParser } = await i18nInstance.getTranslators();

      i18nInstance.t = () => 't';
      i18nInstance.tDateTimeParser = () => 'tDateTimeParser';

      render(
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></TranslationContextConsumer>
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
      let context;
      const i18nInstance = new Streami18n();

      i18nInstance.t = () => 't';
      i18nInstance.tDateTimeParser = () => 'tDateTimeParser';

      const { rerender } = render(
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></TranslationContextConsumer>
        </Chat>,
      );

      await waitFor(() => {
        expect(context.t).toBe(i18nInstance.t);
        expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
      });

      const newI18nInstance = new Streami18n();

      newI18nInstance.t = () => 'newT';
      newI18nInstance.tDateTimeParser = () => 'newtDateTimeParser';

      rerender(
        <Chat client={chatClient} i18nInstance={newI18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          ></TranslationContextConsumer>
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
      jest.spyOn(DBSyncManager, 'init');

      // initial mount and render
      const { rerender } = render(
        <Chat client={chatClientWithUser} enableOfflineSupport key={1} />,
      );

      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      const unsubscribeSpy = jest.spyOn(DBSyncManager.connectionChangedListener, 'unsubscribe');
      const listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];

      // remount
      rerender(<Chat client={chatClientWithUser} enableOfflineSupport key={2} />);

      await waitFor(() => {
        expect(DBSyncManager.init).toHaveBeenCalledTimes(2);
        expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
        expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
          listenersAfterInitialMount.length,
        );
      });
    });

    it('makes sure DBSyncManager listeners are cleaned up if the user changes', async () => {
      const chatClientWithUser = await getTestClientWithUser({ id: 'testID1' });
      jest.spyOn(DBSyncManager, 'init');

      // initial render
      const { rerender } = render(<Chat client={chatClientWithUser} enableOfflineSupport />);

      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      const unsubscribeSpy = jest.spyOn(DBSyncManager.connectionChangedListener, 'unsubscribe');
      await act(async () => {
        await setUser(chatClientWithUser, { id: 'testID2' });
      });
      const listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];

      // rerender with different user ID
      rerender(<Chat client={chatClientWithUser} enableOfflineSupport />);

      await waitFor(() => {
        expect(DBSyncManager.init).toHaveBeenCalledTimes(2);
        expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
        expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
          listenersAfterInitialMount.length,
        );
      });
    });

    it('makes sure DBSyncManager state stays intact during normal rerenders', async () => {
      const chatClientWithUser = await getTestClientWithUser({ id: 'testID' });
      jest.spyOn(DBSyncManager, 'init');

      // initial render
      const { rerender } = render(<Chat client={chatClientWithUser} enableOfflineSupport />);

      // the unsubscribe fn changes during init(), so we keep a reference to the spy
      const unsubscribeSpy = jest.spyOn(DBSyncManager.connectionChangedListener, 'unsubscribe');
      const listenersAfterInitialMount = chatClientWithUser.listeners['connection.changed'];

      // rerender
      rerender(<Chat client={chatClientWithUser} enableOfflineSupport />);

      await waitFor(() => {
        expect(DBSyncManager.init).toHaveBeenCalledTimes(1);
        expect(unsubscribeSpy).toHaveBeenCalledTimes(0);
        expect(chatClientWithUser.listeners['connection.changed'].length).toBe(
          listenersAfterInitialMount.length,
        );
      });
    });
  });
});
