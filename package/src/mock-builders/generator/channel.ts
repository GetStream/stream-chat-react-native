/* eslint-disable @typescript-eslint/no-explicit-any */
import { Channel, ChannelResponse } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import { generateUser, getUserDefaults } from './user';

const defaultCapabilities = [
  'ban-channel-members',
  'delete-any-message',
  'delete-own-message',
  'flag-message',
  'mute-channel',
  'pin-message',
  'quote-message',
  'read-events',
  'send-links',
  'send-message',
  'send-reaction',
  'send-reply',
  'typing-events',
  'update-any-message',
  'update-own-message',
  'upload-file',
];

const defaultConfig = {
  automod: 'disabled',
  automod_behavior: 'flag',
  commands: [
    {
      args: '[text]',
      description: 'Post a random gif to the channel',
      name: 'giphy',
      set: 'fun_set',
    },
  ],
  connect_events: true,
  created_at: '2020-04-24T11:36:43.859020368Z',
  max_message_length: 5000,
  message_retention: 'infinite',
  mutes: true,
  name: 'messaging',
  reactions: true,
  read_events: true,
  replies: true,
  search: true,
  typing_events: true,
  updated_at: '2020-04-24T11:36:43.859022903Z',
  uploads: true,
  url_enrichment: true,
};
const defaultState = {
  members: {},
  messages: [],
  setIsUpToDate: jest.fn(),
};

const getChannelDefaults = (
  { id, type }: { [key: string]: any } = { id: uuidv4(), type: 'messaging' },
) => ({
  _client: {},
  cid: `${type}:${id}`,
  data: {
    cid: `${type}:${id}`,
    config: {
      ...defaultConfig,
      name: type,
      type,
    },
    created_at: '2020-04-28T11:20:48.578147Z',
    created_by: getUserDefaults(),
    frozen: false,
    id,
    own_capabilities: defaultCapabilities,
    type,
    updated_at: '2020-04-28T11:20:48.578147Z',
  },
  id,
  state: defaultState,
  type,
});

export const generateChannel = (customValues: { [key: string]: any }) =>
  Object.keys(customValues).reduce((accumulated, current) => {
    if (current in accumulated) {
      const key = current as keyof typeof accumulated;
      accumulated[key] =
        typeof accumulated[key] === 'object'
          ? { ...accumulated[key], ...customValues[key] }
          : (accumulated[key] = customValues[key]);
      return accumulated;
    }
    return { ...accumulated, [current]: customValues[current] };
  }, getChannelDefaults());

export const generateChannel1 = (options: { channel: any; config: any; members: any }) => {
  const { channel: optionsChannel, config, ...optionsBesidesChannel } = options;
  const idFromOptions = optionsChannel && optionsChannel.id;
  const type = (optionsChannel && optionsChannel.type) || 'messaging';
  const id = idFromOptions
    ? idFromOptions
    : options.members && options.members.length
    ? `!members-${uuidv4()}`
    : uuidv4();
  return {
    ...optionsBesidesChannel,
    messages: [],
    members: [],
    channel: {
      type,
      id,
      created_at: '2020-04-28T11:20:48.578147Z',
      updated_at: '2020-04-28T11:20:48.578147Z',
      created_by: {
        id: 'vishal',
        role: 'user',
        created_at: '2020-04-27T13:05:13.847572Z',
        updated_at: '2020-04-28T11:21:08.357468Z',
        last_active: '2020-04-28T11:21:08.353026Z',
        banned: false,
        online: false,
      },
      frozen: false,
      config: {
        created_at: '2020-04-24T11:36:43.859020368Z',
        updated_at: '2020-04-24T11:36:43.859022903Z',
        name: 'messaging',
        typing_events: true,
        read_events: true,
        connect_events: true,
        search: true,
        reactions: true,
        replies: true,
        mutes: true,
        uploads: true,
        url_enrichment: true,
        message_retention: 'infinite',
        max_message_length: 5000,
        automod: 'disabled',
        automod_behavior: 'flag',
        commands: [
          {
            name: 'giphy',
            description: 'Post a random gif to the channel',
            args: '[text]',
            set: 'fun_set',
          },
        ],
        ...config,
      },
      ...optionsChannel,
    },
  };
};

export const generateMember = (options: { user: { id: string } }) => ({
  user_id: options.user.id,
  is_moderator: false,
  invited: false,
  role: 'member',
  ...options,
});

export const generateChannelResponse = (
  customValues: {
    channel?: Record<string, any>;
    id?: string;
    messages?: Record<string, any>[];
    type?: string;
  } = { channel: {}, id: uuidv4(), messages: [], type: 'messaging' },
) => {
  const { channel = {}, id = uuidv4(), messages = [], type = 'messaging', ...rest } = customValues;

  const defaults = getChannelDefaults();
  return {
    channel: {
      ...defaults.data,
      ...{
        cid: `${type}:${id}`,
        ...channel,
        id,
        type,
        user: generateUser(),
      },
    },
    members: [],
    messages,
    ...rest,
  };
};
