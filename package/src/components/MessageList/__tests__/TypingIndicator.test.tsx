import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { TypingProvider } from '../../../contexts/typingContext/TypingContext';

import { generateStaticUser, generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { TypingIndicator } from '../TypingIndicator';

afterEach(cleanup);

describe('TypingIndicator', () => {
  let chatClient;

  it('should render typing indicator for two users', async () => {
    const user0 = generateUser();
    const user1 = generateUser();
    const user2 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 }, user2: { user: user2 } };

    const { getAllByTestId, getByTestId } = render(
      <Chat client={chatClient}>
        <TypingProvider value={{ typing }}>
          <TypingIndicator />
        </TypingProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getAllByTestId('user-avatar')).toHaveLength(2);
    });
  });

  it('should render typing indicator for one user', async () => {
    const user0 = generateUser();
    const user1 = generateUser();

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 } };

    const { getAllByTestId, getByTestId } = render(
      <Chat client={chatClient}>
        <TypingProvider value={{ typing }}>
          <TypingIndicator />
        </TypingProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId('typing-indicator')).toBeTruthy();
      expect(getAllByTestId('user-avatar')).toHaveLength(1);
    });
  });

  it('should match typing indicator snapshot', async () => {
    const user0 = generateStaticUser(0);
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);

    chatClient = await getTestClientWithUser({ id: user0.id });
    await chatClient.setUser(user0, 'testToken');
    const typing = { user1: { user: user1 }, user2: { user: user2 } };

    const { toJSON } = render(
      <Chat client={chatClient}>
        <TypingProvider value={{ typing }}>
          <TypingIndicator />
        </TypingProvider>
      </Chat>,
    );
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
