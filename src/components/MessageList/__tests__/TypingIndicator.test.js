import React from 'react';
import { View } from 'react-native';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import {
  generateStaticUser,
  generateUser,
  getTestClientWithUser,
} from 'mock-builders';

import { Chat } from '../../Chat';
import { ChannelContext, TranslationContext } from '../../../context';
import TypingIndicator from '../TypingIndicator';
import { Streami18n } from '../../../utils';

afterEach(cleanup);

describe('TypingIndicator', () => {
  let chatClient;

  it('should render typing indicator for two users', async () => {
    const t = jest.fn((key) => key);
    const user0 = generateUser();
    const user1 = generateUser();
    const user2 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 }, user2: { user: user2 } };

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );
    expect(t).toHaveBeenCalledWith(
      '{{ firstUser }} and {{ secondUser }} are typing...',
      {
        firstUser: user1.name,
        secondUser: user2.name,
      },
    );
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should render typing indicator for one user', async () => {
    const t = jest.fn((key) => key);
    const user0 = generateUser();
    const user1 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 } };

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );
    expect(t).toHaveBeenCalledWith('{{ user }} is typing...', {
      user: user1.name,
    });
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
    });
  });

  it('should render typing Avatar for one user', async () => {
    const t = jest.fn((key) => key);
    const user0 = generateUser();
    const user1 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 } };

    const { getByTestId, queryByTestId } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator Avatar={View} />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );
    expect(t).toHaveBeenCalledWith('{{ user }} is typing...', {
      user: user1.name,
    });

    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getByTestId('typing-avatar-0')).toBeTruthy();
      expect(queryByTestId('typing-avatar-1')).toBeFalsy();
    });
  });

  it('should render typing Avatar for two users', async () => {
    const t = jest.fn((key) => key);
    const user0 = generateUser();
    const user1 = generateUser();
    const user2 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 }, user2: { user: user2 } };

    const { getByTestId } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator Avatar={View} />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getByTestId('typing-avatar-0')).toBeTruthy();
      expect(getByTestId('typing-avatar-1')).toBeTruthy();
    });
  });

  it('should render no typing Avatars', async () => {
    const t = jest.fn((key) => key);
    const user0 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = {};

    const { getByTestId, queryByTestId } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator Avatar={View} />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(queryByTestId('typing-avatar-0')).toBeFalsy();
      expect(queryByTestId('typing-avatar-1')).toBeFalsy();
    });
  });

  it('should match typing indicator snapshot', async () => {
    const i18nInstance = new Streami18n();
    const { t } = await i18nInstance.getTranslators();
    const user0 = generateStaticUser(0);
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 }, user2: { user: user2 } };

    const { toJSON } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ t }}>
          <ChannelContext.Provider value={{ typing }}>
            <TypingIndicator />
          </ChannelContext.Provider>
        </TranslationContext.Provider>
      </Chat>,
    );
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
