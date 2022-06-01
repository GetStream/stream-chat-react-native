import React, { FC, ReactElement } from 'react';
import { Text } from 'react-native';

import { render, RenderOptions, waitFor } from '@testing-library/react-native';

import type { DefaultStreamChatGenerics } from 'src/types/types';

import type {
  Channel,
  DefaultGenerics,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { ChatContext, ChatContextValue } from '../../../../contexts/chatContext/ChatContext';

import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';

import { useLatestMessagePreview } from '../useLatestMessagePreview';

describe('useLatestMessagePreview', () => {
  const FORCE_UPDATE = 15;
  const clientUser = generateUser();
  let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  const ChatProvider: FC<{ children: React.ReactNode }> = ({ children }) => (
    <ChatContext.Provider
      value={
        {
          auto_translation_enabled: true,
          client: chatClient,
        } as unknown as ChatContextValue
      }
    >
      {children}
    </ChatContext.Provider>
  );

  const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper: ChatProvider, ...options });

  it('should return a channel latest message', async () => {
    const channelName = 'okechukwu';
    const channel = {
      data: { name: channelName },
    } as unknown as Channel<DefaultStreamChatGenerics>;

    const TestComponent = () => {
      const channelLatestMessage = useLatestMessagePreview(
        {
          data: { name: channelName },
          state: { messages: [] },
        } as unknown as Channel<DefaultStreamChatGenerics>,
        FORCE_UPDATE,
        {
          args: 'string',
          attachments: [],
          channel,
          cid: 'string',
          command: 'string',
          command_info: { name: 'string' },
          created_at: 'string',
          deleted_at: 'string',
          id: 'string',
          type: 'MessageLabel',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      );

      return <Text>{JSON.stringify(channelLatestMessage)}</Text>;
    };

    const { getByText } = customRender(<TestComponent />);

    await waitFor(() => {
      expect(
        getByText(
          JSON.stringify({
            created_at: 'LT',
            messageObject: undefined,
            previews: [{ bold: false, text: 'Nothing yet...' }],
            status: 0,
          }),
        ),
      ).toBeTruthy();
    });
  });
});
