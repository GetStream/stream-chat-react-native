import React, { FC } from 'react';

import { renderHook } from '@testing-library/react-hooks';
import type { DefaultStreamChatGenerics } from 'src/types/types';
import type { DefaultGenerics, StreamChat } from 'stream-chat';

import { useCreatePaginatedMessageListContext } from '../../../components/Channel/hooks/useCreatePaginatedMessageListContext';
import {
  ChatContext,
  ChatContextValue,
  PaginatedMessageListContextValue,
  PaginatedMessageListProvider,
} from '../../../contexts';

import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { useMessageList } from '../hooks/useMessageList';

jest.mock('react-native-fs', () => ({}));

const clientUser = generateUser();
let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;

beforeEach(async () => {
  chatClient = await getTestClientWithUser(clientUser);
});

const messages = new Array(10)
  .fill(undefined)
  .map((_: undefined, id: number) => generateMessage({ id }));

const Providers: FC<{ children: React.ReactNode }> = ({ children }) => {
  const messageListContext = useCreatePaginatedMessageListContext({
    messages,
  } as unknown as PaginatedMessageListContextValue);

  return (
    <ChatContext.Provider
      value={
        {
          auto_translation_enabled: true,
          client: chatClient,
        } as unknown as ChatContextValue
      }
    >
      <PaginatedMessageListProvider value={messageListContext}>
        {children}
      </PaginatedMessageListProvider>
    </ChatContext.Provider>
  );
};

describe('useMessageList', () => {
  it('should always return a list of reversed messages', () => {
    const { result } = renderHook(
      () =>
        useMessageList({
          noGroupByUser: true,
          threadList: false,
        }),
      { wrapper: Providers },
    );
    const reversedMessages = messages.reverse();
    expect(result.current.map(({ id }) => id)).toEqual(reversedMessages.map(({ id }) => id));
  });
});
