import { v4 as uuidv4 } from 'uuid';

export const generateChannel = (options = { channel: {} }) => {
  const { channel: optionsChannel, ...optionsBesidesChannel } = options;
  const id = (optionsChannel && optionsChannel.id) || uuidv4();
  const type = (optionsChannel && optionsChannel.type) || 'messaging';
  return {
    messages: [],
    members: [],
    ...optionsBesidesChannel,
    channel: {
      id,
      type,
      cid: `${type}:${id}`,
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
      },
      ...optionsChannel,
    },
  };
};
