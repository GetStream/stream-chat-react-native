import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';
import { v5 as uuidv5 } from 'uuid';

import Thread from '../Thread';
import {
  generateStaticMessage,
  generateStaticUser,
  generateChannel,
  generateMember,
  getTestClientWithUser,
  useMockedApis,
  getOrCreateChannelApi,
  generateMessage,
} from '../../../mock-builders';
import { Streami18n } from '../../../utils';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { TranslationContext } from '../../../context';
const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';

afterEach(cleanup);

describe('Thread', () => {
  let chatClient;

  it('should render a new thread', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const thread = generateMessage({ text: 'Thread Message Text' });
    const parent_id = thread.id;
    const mockedChannel = generateChannel({
      messages: [
        thread,
        generateMessage({ parent_id, text: 'Response Message Text' }),
        generateMessage({ parent_id }),
        generateMessage({ parent_id }),
      ],
    });

    chatClient = await getTestClientWithUser({ id: 'Neil' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { getByText, getAllByText } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ ...translators, t }}>
          <Channel client={chatClient} channel={channel} thread={thread}>
            <Thread thread={thread} />
          </Channel>
        </TranslationContext.Provider>
      </Chat>,
    );

    expect(t).toHaveBeenCalledWith('Loading messages ...');
    await waitFor(() => {
      expect(t).toHaveBeenCalledWith('Start of a new thread');
      expect(getByText('Start of a new thread')).toBeTruthy();
      expect(getAllByText('Thread Message Text')).toHaveLength(4);
    });
  });

  it('should match thread snapshot', async () => {
    const i18nInstance = new Streami18n();
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(2);
    const thread = generateStaticMessage(
      'Message3',
      { user: user2 },
      '2020-05-05T14:50:00.000Z',
    );
    const parent_id = thread.id;
    const mockedChannel = generateChannel({
      messages: [
        generateStaticMessage(
          'Message1',
          { user: user1 },
          '2020-05-05T14:48:00.000Z',
        ),
        generateStaticMessage(
          'Message2',
          { user: user2 },
          '2020-05-05T14:49:00.000Z',
        ),
        thread,
        generateStaticMessage(
          'Message4',
          { user: user1, parent_id },
          '2020-05-05T14:50:00.000Z',
        ),
        generateStaticMessage(
          'Message5',
          { user: user2, parent_id },
          '2020-05-05T14:50:00.000Z',
        ),
        generateStaticMessage(
          'Message6',
          { user: user1, parent_id },
          '2020-05-05T14:50:00.000Z',
        ),
      ],
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
      channel: {
        id: uuidv5('Channel', StreamReactNativeNamespace),
      },
    });

    chatClient = await getTestClientWithUser({ id: 'testID2' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    const { toJSON } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <Channel client={chatClient} channel={channel} thread={thread}>
          <Thread thread={thread} />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
