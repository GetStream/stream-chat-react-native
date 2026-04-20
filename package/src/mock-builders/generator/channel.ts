import type {
  ChannelMemberResponse,
  ChannelResponse,
  LocalMessage,
  MessageResponse,
  ReadResponse,
} from 'stream-chat';
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
      name: 'giphy' as const,
      set: 'fun_set' as const,
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
  reminders: false,
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

export type GeneratedChannel = {
  _client: Record<string, unknown>;
  channel: Partial<ChannelResponse> & { config: typeof defaultConfig };
  cid: string;
  id: string;
  messages: Partial<MessageResponse>[];
  state: typeof defaultState;
  type: string;
};

type GeneratedChannelIdType = { id?: string; type?: string };

const getChannelDefaults = (opts: GeneratedChannelIdType = {}): GeneratedChannel => {
  const id = opts.id ?? uuidv4();
  const type = opts.type ?? 'messaging';
  return {
    _client: {},
    channel: {
      cid: `${type}:${id}`,
      config: {
        ...defaultConfig,
        name: type,
      },
      created_at: '2020-04-28T11:20:48.578147Z',
      created_by: getUserDefaults(),
      frozen: false,
      id,
      own_capabilities: defaultCapabilities,
      type,
      updated_at: '2020-04-28T11:20:48.578147Z',
    },
    cid: `${type}:${id}`,
    id,
    messages: [],
    state: defaultState,
    type,
  };
};

export const generateChannel = (
  customValues: Partial<GeneratedChannel> & Record<string, unknown> = {},
): GeneratedChannel =>
  Object.keys(customValues).reduce<GeneratedChannel>((accumulated, current) => {
    const key = current as keyof GeneratedChannel;
    if (current in accumulated) {
      (accumulated as Record<string, unknown>)[current] =
        typeof accumulated[key] === 'object'
          ? { ...(accumulated[key] as object), ...(customValues[current] as object) }
          : customValues[current];
      return accumulated;
    }
    return { ...accumulated, [current]: customValues[current] } as GeneratedChannel;
  }, getChannelDefaults());

type ChannelResponseMessage = Partial<MessageResponse> | LocalMessage;

export type GeneratedChannelResponseCustomValues = {
  channel?: Partial<ChannelResponse>;
  id?: string;
  messages?: ChannelResponseMessage[];
  members?: Partial<ChannelMemberResponse>[];
  read?: Partial<ReadResponse>[];
  type?: string;
};

export const generateChannelResponse = (
  customValues: GeneratedChannelResponseCustomValues = {
    channel: {},
    id: uuidv4(),
    members: [],
    messages: [],
    read: [],
    type: 'messaging',
  },
) => {
  const {
    channel = {},
    id = uuidv4(),
    messages = [],
    members = [],
    read,
    type = 'messaging',
    ...rest
  } = customValues;

  const defaults = getChannelDefaults();
  return {
    channel: {
      ...defaults.channel,
      ...{
        cid: `${type}:${id}`,
        ...channel,
        id,
        member_count: members.length,
        type,
        user: generateUser(),
      },
    },
    members,
    messages,
    read,
    ...rest,
  };
};
