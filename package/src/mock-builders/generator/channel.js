import { v4 as uuidv4 } from 'uuid';

export const generateChannel = (options = { channel: {} }) => {
  const { channel: optionsChannel, ...optionsBesidesChannel } = options;
  const id = (optionsChannel && optionsChannel.id) || uuidv4();
  const type = (optionsChannel && optionsChannel.type) || 'messaging';
  return {
    channel: {
      cid: `${type}:${id}`,
      config: {
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
      },
      created_at: '2020-04-28T11:20:48.578147Z',
      created_by: {
        banned: false,
        created_at: '2020-04-27T13:05:13.847572Z',
        id: 'vishal',
        last_active: '2020-04-28T11:21:08.353026Z',
        online: false,
        role: 'user',
        updated_at: '2020-04-28T11:21:08.357468Z',
      },
      frozen: false,
      id,
      type,
      updated_at: '2020-04-28T11:20:48.578147Z',
      ...optionsChannel,
    },
    members: [],
    messages: [],
    ...optionsBesidesChannel,
  };
};
