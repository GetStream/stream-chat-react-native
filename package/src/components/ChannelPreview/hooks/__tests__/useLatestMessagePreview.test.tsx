import React, { FC } from 'react';

import { renderHook, waitFor } from '@testing-library/react-native';

import { ChannelResponse, MessageResponse, StreamChat } from 'stream-chat';

import { ChatContext, ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import {
  CHANNEL_WITH_DELETED_MESSAGES,
  CHANNEL_WITH_EMPTY_MESSAGE,
  CHANNEL_WITH_MENTIONED_USERS,
  CHANNEL_WITH_MESSAGES_ATTACHMENTS,
  CHANNEL_WITH_MESSAGES_COMMAND,
  CHANNEL_WITH_MESSAGES_TEXT,
  CHANNEL_WITH_NO_MESSAGES,
  LATEST_MESSAGE,
} from '../../../../mock-builders/api/channelMocks';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { useLatestMessagePreview } from '../useLatestMessagePreview';

const initChannelFromData = async (chatClient: StreamChat, channelData: ChannelResponse) => {
  const mockedChannel = generateChannelResponse(channelData);
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  return channel;
};

describe('useLatestMessagePreview', () => {
  const FORCE_UPDATE = 15;
  const clientUser = generateUser();
  let chatClient: StreamChat | StreamChat;

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

  it('should return a deleted message preview if the latest message is deleted', async () => {
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_DELETED_MESSAGES as unknown as ChannelResponse,
    );

    const latestMessage = { cid: 'test', type: 'deleted' } as unknown as MessageResponse;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([{ bold: false, text: 'Message deleted' }]);
    });
  });

  it('should return an "Nothing yet..." message preview if channel has no messages', async () => {
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_NO_MESSAGES as unknown as ChannelResponse,
    );
    const latestMessage = undefined;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current.previews).toEqual([{ bold: false, text: 'Nothing yet...' }]);
    });
  });

  it('should use latestMessage if provided', async () => {
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_MESSAGES_TEXT as unknown as ChannelResponse,
    );
    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, LATEST_MESSAGE),
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
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_EMPTY_MESSAGE as unknown as ChannelResponse,
    );
    const latestMessage = {} as unknown as MessageResponse;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
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
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_MENTIONED_USERS as unknown as ChannelResponse,
    );
    const latestMessage = {
      mentioned_users: [{ id: 'Max', name: 'Max' }],
      text: 'Max',
      user: {
        id: 'okechukwu',
      },
    } as unknown as MessageResponse;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
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
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_MESSAGES_COMMAND as unknown as ChannelResponse,
    );

    const latestMessage = {
      command: 'giphy',
      user: {
        id: 'okechukwu',
      },
    } as unknown as MessageResponse;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
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
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_MESSAGES_ATTACHMENTS as unknown as ChannelResponse,
    );
    const latestMessage = {
      attachments: ['arbitrary value'],
      user: {
        id: 'okechukwu',
      },
    } as unknown as MessageResponse;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
      { wrapper: ChatProvider },
    );

    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: true, text: '@okechukwu: ' },
        { bold: false, text: '🏙 Attachment...' },
      ]);
    });
  });

  it('should default to messages from the channel state if latestMessage is undefined', async () => {
    const channel = await initChannelFromData(
      chatClient,
      CHANNEL_WITH_MESSAGES_TEXT as unknown as ChannelResponse,
    );
    const latestMessage = undefined;

    const { result } = renderHook(
      () => useLatestMessagePreview(channel, FORCE_UPDATE, latestMessage),
      { wrapper: ChatProvider },
    );

    await waitFor(() => {
      expect(result.current.previews).toEqual([
        { bold: true, text: '@okechukwu: ' },
        { bold: false, text: 'jkbkbiubicbi' },
      ]);
    });
  });
});
