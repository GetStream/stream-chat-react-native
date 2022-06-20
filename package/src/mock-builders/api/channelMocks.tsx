import type {
  Attachment,
  Channel,
  FormatMessageResponse,
  MessageResponse,
  UserResponse,
} from 'stream-chat';

import {
  GROUP_CHANNEL_MEMBERS_MOCK,
  ONE_MEMBER_WITH_EMPTY_USER_MOCK,
} from '../../mock-builders/api/queryMembers';

import type { DefaultStreamChatGenerics } from '../../types/types';

const channelName = 'okechukwu';
const CHANNEL = {
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
        channel: CHANNEL,
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
        channel: CHANNEL,
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

const CHANNEL_WITH_DELETED_MESSAGES = {
  data: { name: channelName },
  state: {
    members: GROUP_CHANNEL_MEMBERS_MOCK,
    messages: [
      {
        type: 'deleted',
      } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      {
        type: 'deleted',
      } as unknown as MessageResponse<DefaultStreamChatGenerics>,
    ],
  },
} as unknown as Channel<DefaultStreamChatGenerics>;

const CHANNEL_WITH_NO_MESSAGES = {
  data: { name: channelName },
  state: {
    members: GROUP_CHANNEL_MEMBERS_MOCK,
    messages: [],
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
        channel: CHANNEL,
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
        channel: CHANNEL,
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
        channel: CHANNEL,
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
  channel: CHANNEL,
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
          { id: 'Max', name: 'Max' },
          { id: 'Ada', name: 'Ada' },
          { id: 'Enzo', name: 'Enzo' },
        ] as UserResponse<DefaultStreamChatGenerics>[],
      } as unknown as MessageResponse<DefaultStreamChatGenerics>,
      {
        args: 'string',
        attachments: [],
        cid: 'stridodong',
        command_info: { name: 'string' },
        created_at: new Date('2021-02-12T12:12:35.862Z'),
        deleted_at: new Date('2021-02-12T12:12:35.862Z'),
        mentioned_users: [
          { id: 'Max', name: 'Max' },
          { id: 'Ada', name: 'Ada' },
          { id: 'Enzo', name: 'Enzo' },
        ] as UserResponse<DefaultStreamChatGenerics>[],
      } as unknown as MessageResponse<DefaultStreamChatGenerics>,
    ],
  },
} as unknown as Channel<DefaultStreamChatGenerics>;

const CHANNEL_WITH_MESSAGES = {
  data: { name: channelName },
  state: {
    members: GROUP_CHANNEL_MEMBERS_MOCK,
    messages: [FORMATTED_MESSAGE, FORMATTED_MESSAGE],
  },
} as unknown as Channel<DefaultStreamChatGenerics>;

export {
  CHANNEL,
  CHANNEL_WITH_MESSAGES,
  CHANNEL_WITH_MENTIONED_USERS,
  FORMATTED_MESSAGE,
  LATEST_MESSAGE,
  CHANNEL_WITH_MESSAGES_ATTACHMENTS,
  CHANNEL_WITH_MESSAGES_COMMAND,
  CHANNEL_WITH_NO_MESSAGES,
  CHANNEL_WITH_DELETED_MESSAGES,
  CHANNEL_WITH_MESSAGES_TEXT,
};
