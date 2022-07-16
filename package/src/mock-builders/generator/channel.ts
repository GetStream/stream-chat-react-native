/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const generateChannelResponse = (
  customValues: {
    channel?: Record<string, any>;
    id?: string;
    messages?: Record<string, any>[];
    type?: string;
  } = { channel: {}, id: uuidv4(), messages: [], type: 'messaging' },
) => {
  const { id = uuidv4(), messages = [], type = 'messaging', channel = {}, ...rest } = customValues;

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
