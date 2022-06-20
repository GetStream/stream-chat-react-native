import React, { FC } from 'react';

import { renderHook } from '@testing-library/react-hooks/native';
import { waitFor } from '@testing-library/react-native';

import type { DefaultStreamChatGenerics } from 'src/types/types';

import type {
  Attachment,
  Channel,
  DefaultGenerics,
  FormatMessageResponse,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import { ChatContext, ChatContextValue } from '../../../../contexts/chatContext/ChatContext';
import {
  GROUP_CHANNEL_MEMBERS_MOCK,
  ONE_MEMBER_WITH_EMPTY_USER_MOCK,
} from '../../../../mock-builders/api/queryMembers';

import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';

import { useLatestMessagePreview } from '../useLatestMessagePreview';

describe('useLatestMessagePreview', () => {
  const FORCE_UPDATE = 15;
  const clientUser = generateUser();
  let chatClient: StreamChat<DefaultGenerics> | StreamChat<DefaultStreamChatGenerics>;

  const channelName = 'okechukwu';
  const channel = {
    data: { name: channelName },
    state: { messages: [] },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const CHANNEL_WITH_MESSAGES_TEXT = {
    data: { name: channelName },
    state: {
      members: GROUP_CHANNEL_MEMBERS_MOCK,
      messages: [
        {
          args: 'string',
          attachments: [],
          channel,
          cid: 'stridkncnng',
          command: 'giphy',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'ljkblk',
          text: 'jkbkbiubicbi',
          type: 'MessageLabel',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
        {
          args: 'string',
          attachments: [],
          channel,
          cid: 'stridodong',
          command: 'giphy',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'jbkjb',
          text: 'jkbkbiubicbi',
          type: 'MessageLabel',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      ],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const CHANNEL_WITH_NO_MESSAGES = {
    data: { name: channelName },
    state: {
      members: GROUP_CHANNEL_MEMBERS_MOCK,
      messages: [
        // {
        //   args: 'string',
        //   attachments: [],
        //   channel,
        //   cid: 'stridkncnng',
        //   command: 'giphy',
        //   command_info: { name: 'string' },
        //   created_at: new Date('2021-02-12T12:12:35.862Z'),
        //   deleted_at: new Date('2021-02-12T12:12:35.862Z'),
        //   id: 'ljkblk',
        //   text: 'jkbkbiubicbi',
        //   type: 'MessageLabel',
        //   user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        // } as unknown as MessageResponse<DefaultStreamChatGenerics>,
        // {
        //   args: 'string',
        //   attachments: [],
        //   channel,
        //   cid: 'stridodong',
        //   command: 'giphy',
        //   command_info: { name: 'string' },
        //   created_at: new Date('2021-02-12T12:12:35.862Z'),
        //   deleted_at: new Date('2021-02-12T12:12:35.862Z'),
        //   id: 'jbkjb',
        //   text: 'jkbkbiubicbi',
        //   type: 'MessageLabel',
        //   user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        // } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      ],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const CHANNEL_WITH_MESSAGES_COMMAND = {
    data: { name: channelName },
    state: {
      members: GROUP_CHANNEL_MEMBERS_MOCK,
      messages: [
        {
          args: 'string',
          attachments: [],
          channel,
          cid: 'stridkncnng',
          command: 'giphy',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'ljkblk',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
        {
          args: 'string',
          attachments: [],
          channel,
          cid: 'stridodong',
          command: 'giphy',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'jbkjb',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      ],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const CHANNEL_WITH_MESSAGES_ATTACHMENTS = {
    data: { name: channelName },
    state: {
      members: GROUP_CHANNEL_MEMBERS_MOCK,
      messages: [
        {
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
            } as Attachment<DefaultStreamChatGenerics>,
          ],
          channel,
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          id: 'ljkblk',
          user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      ],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const LATEST_MESSAGE = {
    args: 'string',
    attachments: [],
    channel,
    cid: 'string',
    command: 'giphy',
    command_info: { name: 'string' },
    created_at: new Date('2021-02-12T12:12:35.862Z'),
    deleted_at: new Date('2021-02-12T12:12:35.862Z'),
    id: 'string',
    text: 'jkbkbiubicbi',
    type: 'MessageLabel',
    user: { id: 'okechukwu' } as unknown as UserResponse<DefaultStreamChatGenerics>,
  } as unknown as MessageResponse<DefaultStreamChatGenerics>;

  const FORMATTED_MESSAGE: FormatMessageResponse<DefaultStreamChatGenerics> = {
    created_at: new Date('2021-02-12T12:12:35.862282Z'),
    id: '',
    message: {} as unknown as MessageResponse<DefaultStreamChatGenerics>,
    pinned_at: new Date('2021-02-12T12:12:35.862282Z'),
    status: 'received',
    updated_at: new Date('2021-02-12T12:12:35.862282Z'),
  };

  const CHANNEL_WITH_MENTIONED_USERS = {
    state: {
      members: ONE_MEMBER_WITH_EMPTY_USER_MOCK,
      messages: [
        {
          args: 'string',
          attachments: [],
          cid: 'stridkncnng',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
          mentioned_users: [
            { id: 'Max' },
            { id: 'Ada' },
            { id: 'Enzo' },
          ] as UserResponse<DefaultStreamChatGenerics>[],
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
        {
          args: 'string',
          attachments: [],
          cid: 'stridodong',
          command_info: { name: 'string' },
          created_at: new Date('2021-02-12T12:12:35.862Z'),
          deleted_at: new Date('2021-02-12T12:12:35.862Z'),
        } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      ],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

  const channelWithMessages = {
    data: { name: channelName },
    state: {
      members: GROUP_CHANNEL_MEMBERS_MOCK,
      messages: [FORMATTED_MESSAGE, FORMATTED_MESSAGE],
    },
  } as unknown as Channel<DefaultStreamChatGenerics>;

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
      () => useLatestMessagePreview(channel, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    console.log(result.current);
    await waitFor(() => {
      expect(result.current).toBeTruthy();
    });
  });

  it('should return a channel', async () => {
    const { result } = renderHook(
      () => useLatestMessagePreview(channelWithMessages, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    console.log(result.current);
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
    console.log(result.current);
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
    console.log(result.current.created_at);
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
      () => useLatestMessagePreview(CHANNEL_WITH_MENTIONED_USERS, FORCE_UPDATE, LATEST_MESSAGE),
      { wrapper: ChatProvider },
    );
    console.log(result.current.created_at);
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
        },
        previews: [
          { bold: false, text: '' },
          { bold: false, text: 'Empty message...' },
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
    console.log(result.current.created_at);
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
    console.log(result.current.created_at);
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
