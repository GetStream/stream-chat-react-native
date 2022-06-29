import React, { FC } from 'react';

import { renderHook } from '@testing-library/react-hooks/native';
import { waitFor } from '@testing-library/react-native';

import type { DefaultStreamChatGenerics } from 'src/types/types';

import type { DefaultGenerics, StreamChat } from 'stream-chat';

import { ChatContext, ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import {
  CHANNEL,
  CHANNEL_WITH_DELETED_MESSAGES,
  CHANNEL_WITH_EMPTY_MESSAGE,
  CHANNEL_WITH_MENTIONED_USERS,
  CHANNEL_WITH_MESSAGES,
  CHANNEL_WITH_MESSAGES_ATTACHMENTS,
  CHANNEL_WITH_MESSAGES_COMMAND,
  CHANNEL_WITH_MESSAGES_TEXT,
  CHANNEL_WITH_NO_MESSAGES,
  LATEST_MESSAGE,
} from '../../../../mock-builders/api/channelMocks';

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

  it('should return a channel latest message', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toBeTruthy();
    });
  });

  it('should return a channel', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: false, text: '' },
        { bold: false, text: 'Empty message...' },
      ]);
    });
  });

  it('should return a deleted message preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_DELETED_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([{ bold: false, text: 'Message deleted' }]);
    });
  });

  it('should return an "Nothing yet..." message preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_NO_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([{ bold: false, text: 'Nothing yet...' }]);
    });
  });

  it('should return latest message preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES_TEXT, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: true, text: '@okechukwu: ' },
        { bold: false, text: 'jkbkbiubicbi' },
      ]);
    });
  });

  it('should return a channel with an empty message preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_EMPTY_MESSAGE, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: false, text: '' },
        { bold: false, text: 'Empty message...' },
      ]);
    });
  });

  it('should return a mentioned user (@Max) message preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MENTIONED_USERS, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: false, text: '' },
        { bold: false, text: 'Max' },
      ]);
    });
  });

  it('should return the latest command preview', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES_COMMAND, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: true, text: '@okechukwu: ' },
        { bold: false, text: '/giphy' },
      ]);
    });
  });

  it('should return an attachment preview', async () => {
    const { result } = renderHook(
      () =>
        useLatestMessagePreview(CHANNEL_WITH_MESSAGES_ATTACHMENTS, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: true, text: '@okechukwu: ' },
        { bold: false, text: '🏙 Attachment...' },
      ]);
    });
  });
});
