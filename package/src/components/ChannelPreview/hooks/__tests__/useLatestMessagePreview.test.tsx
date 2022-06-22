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
      expect(result.current).toBeTruthy();
    });
  });

  it('should return a channel', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          id: '',
          message: {},
          pinned_at: new Date('2021-02-12T12:12:35.862Z'),
          status: 'received',
          updated_at: new Date('2021-02-12T12:12:35.862Z'),
        },
        previews: [
          { bold: false, text: '' },
          { bold: false, text: 'Empty message...' },
        ],
        status: 0,
      });
    });
  });

  it('should return a nothing yet', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_NO_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'LT',
        previews: [{ bold: false, text: 'Nothing yet...' }],
        status: 0,
      });
    });
  });

  it('should return a deleted message', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_DELETED_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'LT',
        messageObject: {
          type: 'deleted',
        },
        previews: [{ bold: false, text: 'Message deleted' }],
        status: 0,
      });
    });
  });

  it('should return message deleted', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_NO_MESSAGES, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'LT',
        previews: [{ bold: false, text: 'Nothing yet...' }],
        status: 0,
      });
    });
  });

  it('should return latest text', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES_TEXT, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          args: 'string',
          attachments: [],
          channel: { data: { name: 'okechukwu' }, state: { messages: [] } },
          cid: 'stridodong',
          command: 'giphy',
          command_info: {
            name: 'string',
          },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'jbkjb',
          text: 'jkbkbiubicbi',
          type: 'MessageLabel',
          user: {
            id: 'okechukwu',
          },
        },
        previews: [
          { bold: true, text: '@okechukwu: ' },
          { bold: false, text: 'jkbkbiubicbi' },
        ],
        status: 0,
      });
    });
  });

  it('should return a channel with an empty message', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_EMPTY_MESSAGE, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          args: 'string',
          attachments: [],
          cid: 'stridodong',
          command_info: {
            name: 'string',
          },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          mentioned_users: [
            { id: 'Max', name: 'Max' },
            { id: 'Ada', name: 'Ada' },
            { id: 'Enzo', name: 'Enzo' },
          ],
        },
        previews: [
          { bold: false, text: '' },
          { bold: false, text: 'Empty message...' },
        ],
        status: 0,
      });
    });
  });

  it('should return a channel with a mentioned user', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MENTIONED_USERS, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          args: 'string',
          attachments: [],
          cid: 'stridodong',
          command_info: {
            name: 'string',
          },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          mentioned_users: [
            { id: 'Max', name: 'Max' },
            { id: 'Ada', name: 'Ada' },
            { id: 'Enzo', name: 'Enzo' },
          ],
          text: 'Max',
        },
        previews: [
          { bold: false, text: '' },
          { bold: false, text: 'Max' },
        ],
        status: 0,
      });
    });
  });

  it('should return latest command', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(CHANNEL_WITH_MESSAGES_COMMAND, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          args: 'string',
          attachments: [],
          channel: { data: { name: 'okechukwu' }, state: { messages: [] } },
          cid: 'stridodong',
          command: 'giphy',
          command_info: {
            name: 'string',
          },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'jbkjb',
          user: {
            id: 'okechukwu',
          },
        },
        previews: [
          { bold: true, text: '@okechukwu: ' },
          { bold: false, text: '/giphy' },
        ],
        status: 0,
      });
    });
  });

  it('should return latest attachment', async () => {
    const { result } = renderHook(
      () =>
        useLatestMessagePreview(CHANNEL_WITH_MESSAGES_ATTACHMENTS, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    await waitFor(() => {
      expect(result.current).toEqual({
        created_at: 'L',
        messageObject: {
          args: 'string',
          attachments: [
            {
              actions: [],
              asset_url: 'string',
              author_icon: 'string',
              author_link: 'string',
              author_name: 'string',
              color: 'string',
              fallback: 'string',
              fields: [],
              file_size: 25,
              footer: 'string',
              footer_icon: 'string',
              image_url: 'string',
              mime_type: 'string',
              og_scrape_url: 'string',
              original_height: 5,
              original_width: 4,
              pretext: 'string',
              text: 'string',
              thumb_url: 'string',
              title: 'string',
              title_link: 'string',
              type: 'string',
            },
          ],
          channel: { data: { name: 'okechukwu' }, state: { messages: [] } },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'ljkblk',
          user: {
            id: 'okechukwu',
          },
        },
        previews: [
          { bold: true, text: '@okechukwu: ' },
          { bold: false, text: '🏙 Attachment...' },
        ],
        status: 0,
      });
    });
  });
});
