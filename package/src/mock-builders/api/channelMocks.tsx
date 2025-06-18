import type { Attachment, Channel, LocalMessage, MessageResponse, UserResponse } from 'stream-chat';

import {
  CHANNEL_MEMBERS,
  GROUP_CHANNEL_MEMBERS_MOCK,
  ONE_MEMBER_WITH_EMPTY_USER,
} from '../../mock-builders/api/queryMembers';

const channelName = 'okechukwu';
const CHANNEL = {
  data: { name: channelName },
  state: { messages: [] },
} as unknown as Channel;

const CHANNEL_WITH_MESSAGES_TEXT = {
  members: CHANNEL_MEMBERS,
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
      user: { id: 'okechukwu' } as unknown as UserResponse,
    } as unknown as MessageResponse,
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
      user: { id: 'okechukwu' } as unknown as UserResponse,
    } as unknown as MessageResponse,
  ],
  name: channelName,
};

const CHANNEL_WITH_DELETED_MESSAGES = {};

const CHANNEL_WITH_NO_MESSAGES = {
  members: CHANNEL_MEMBERS,
  messages: [],
  name: channelName,
};

const CHANNEL_WITH_MESSAGE_COMMAND = {
  members: CHANNEL_MEMBERS,
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
      user: { id: 'okechukwu' } as unknown as UserResponse,
    } as unknown as MessageResponse,
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
      user: { id: 'okechukwu' } as unknown as UserResponse,
    } as unknown as MessageResponse,
  ],
};

const CHANNEL_WITH_MESSAGES_ATTACHMENTS = {
  members: CHANNEL_MEMBERS,
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
        } as Attachment,
      ],
      channel: CHANNEL,
      created_at: new Date('2021-02-12T12:12:35.862Z'),
      deleted_at: new Date('2021-02-12T12:12:35.862Z'),
      id: 'ljkblk',
      user: { id: 'okechukwu' } as unknown as UserResponse,
    } as unknown as MessageResponse,
  ],
  name: channelName,
};

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
  user: { id: 'okechukwu' } as unknown as UserResponse,
} as unknown as MessageResponse;

const FORMATTED_MESSAGE: LocalMessage = {
  created_at: new Date('2021-02-12T12:12:35.862282Z'),
  id: '',
  message: {} as unknown as MessageResponse,
  pinned_at: new Date('2021-02-12T12:12:35.862282Z'),
  status: 'received',
  type: 'regular',
  updated_at: new Date('2021-02-12T12:12:35.862282Z'),
};

const CHANNEL_WITH_MENTIONED_USERS = {
  members: ONE_MEMBER_WITH_EMPTY_USER,
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
      ] as UserResponse[],
      text: 'Max',
    } as unknown as MessageResponse,
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
      ] as UserResponse[],
      text: 'Max',
    } as unknown as MessageResponse,
  ],
};

const CHANNEL_WITH_EMPTY_MESSAGE = {
  members: ONE_MEMBER_WITH_EMPTY_USER,
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
      ] as UserResponse[],
    } as unknown as MessageResponse,
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
      ] as UserResponse[],
    } as unknown as MessageResponse,
  ],
};

const CHANNEL_WITH_MESSAGES = {
  data: { name: channelName },
  state: {
    members: GROUP_CHANNEL_MEMBERS_MOCK,
    messages: [FORMATTED_MESSAGE, FORMATTED_MESSAGE],
  },
};

export {
  CHANNEL,
  CHANNEL_WITH_EMPTY_MESSAGE,
  CHANNEL_WITH_MESSAGES,
  CHANNEL_WITH_MENTIONED_USERS,
  FORMATTED_MESSAGE,
  LATEST_MESSAGE,
  CHANNEL_WITH_MESSAGES_ATTACHMENTS,
  CHANNEL_WITH_MESSAGE_COMMAND as CHANNEL_WITH_MESSAGES_COMMAND,
  CHANNEL_WITH_NO_MESSAGES,
  CHANNEL_WITH_DELETED_MESSAGES,
  CHANNEL_WITH_MESSAGES_TEXT,
};
