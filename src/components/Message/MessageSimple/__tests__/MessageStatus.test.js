import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import {
  generateMessage,
  generateStaticUser,
  generateUser,
  getTestClientWithUser,
} from 'mock-builders';

import { Chat } from '../../../Chat';
import MessageStatus from '../MessageStatus';
import { Streami18n } from '../../../../utils';

afterEach(cleanup);

describe('MessageStatus', () => {
  it('should render message status with spacer', async () => {
    const id = 'testID';
    const chatClient = await getTestClientWithUser({ id });
    const i18nInstance = new Streami18n();
    const user = generateUser();
    const message = generateMessage({ user });
    const { getByTestId } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <MessageStatus
          client={chatClient}
          lastReceivedId={message.id}
          message={message}
          readBy={[{ id }]}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('spacer')).toBeTruthy();
    });
  });

  it('should render message status with delivered container', async () => {
    const id = 'testID';
    const chatClient = await getTestClientWithUser({ id });
    const i18nInstance = new Streami18n();
    const user = generateUser();
    const message = generateMessage({ user });
    const { getByTestId } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <MessageStatus
          client={chatClient}
          lastReceivedId={message.id}
          message={{ ...message, status: 'received' }}
          readBy={[{ id }]}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('delivered-container')).toBeTruthy();
    });
  });

  it('should render message status with read by container', async () => {
    const id = 'testID';
    const chatClient = await getTestClientWithUser({ id });
    const i18nInstance = new Streami18n();
    const user = generateUser();
    const message = generateMessage({ user });
    const { getByTestId, getByText, rerender, toJSON } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <MessageStatus
          client={chatClient}
          lastReceivedId={message.id}
          message={message}
          readBy={[{ id }, { id: user.id, name: user.name }]}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('avatar-text')).toBeTruthy();
      expect(getByTestId('read-by-container')).toBeTruthy();
      expect(getByText(user.name.charAt(0))).toBeTruthy();
    });

    const staticUser = generateStaticUser(0);
    const staticMessage = generateMessage({ staticUser });

    rerender(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <MessageStatus
          client={chatClient}
          lastReceivedId={staticMessage.id}
          message={staticMessage}
          readBy={[
            { id },
            {
              id: staticUser.id,
              image: staticUser.image,
              name: staticUser.name,
            },
          ]}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
      expect(getByTestId('avatar-image')).toBeTruthy();
      expect(getByTestId('read-by-container')).toBeTruthy();
    });
  });

  it('should render message status with sending container', async () => {
    const i18nInstance = new Streami18n();
    const user = generateUser();
    const chatClient = await getTestClientWithUser({ id: user.id });
    const message = generateMessage({ user });
    const { getByTestId } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <MessageStatus
          client={chatClient}
          message={{ ...message, status: 'sending' }}
          readBy={[]}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('sending-container')).toBeTruthy();
    });
  });
});
