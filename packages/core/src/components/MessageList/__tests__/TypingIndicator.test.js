import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { TranslationProvider } from '../../../contexts/translationContext/TranslationContext';
import { TypingProvider } from '../../../contexts/typingContext/TypingContext';

import { generateStaticUser, generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Streami18n } from '../../../utils/Streami18n';
import { Chat } from '../../Chat/Chat';
import { TypingIndicator } from '../TypingIndicator';

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
        <TranslationProvider value={{ t }}>
          <TypingProvider value={{ typing }}>
            <TypingIndicator />
          </TypingProvider>
        </TranslationProvider>
      </Chat>,
    );
    expect(t).toHaveBeenCalledWith('{{ firstUser }} and {{ nonSelfUserLength }} more are typing', {
      firstUser: user1.name,
      nonSelfUserLength: 1,
    });
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
        <TranslationProvider value={{ t }}>
          <TypingProvider value={{ typing }}>
            <TypingIndicator />
          </TypingProvider>
        </TranslationProvider>
      </Chat>,
    );
    expect(t).toHaveBeenCalledWith('{{ user }} is typing', {
      user: user1.name,
    });
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
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
        <TranslationProvider value={{ t }}>
          <TypingProvider value={{ typing }}>
            <TypingIndicator />
          </TypingProvider>
        </TranslationProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
