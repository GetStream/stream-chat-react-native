import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateStaticMessage,
  generateStaticUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';
import { v5 as uuidv5 } from 'uuid';

import { Channel } from '../../Channel';
import { Chat } from '../../Chat';
import {
  ThreadContext,
  TranslationContext,
  ChannelContext,
} from '../../../context';
import Thread from '../Thread';
import { Streami18n } from '../../../utils';

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';

afterEach(cleanup);

describe('Thread', () => {
  it('should render a new thread', async () => {
    const t = jest.fn((key) => key);
    const i18nInstance = new Streami18n();
    const translators = await i18nInstance.getTranslators();
    const thread = generateMessage({ text: 'Thread Message Text' });
    const thread2 = generateMessage({ text: 'Thread2 Message Text' });
    const parent_id = thread.id;
    const mockedChannel = generateChannel({
      messages: [
        thread,
        generateMessage({ parent_id, text: 'Response Message Text' }),
        generateMessage({ parent_id }),
        generateMessage({ parent_id }),
        thread2,
        generateMessage({
          parent_id: thread2.id,
          text: 'Response Message Text2',
        }),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'Neil' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();
    let openThread;

    const { getByText, getAllByText, rerender, queryByText } = render(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ ...translators, t }}>
          <Channel channel={channel} client={chatClient} thread={thread}>
            <ThreadContext.Consumer>
              {(c) => {
                openThread = c.openThread;
                return <Thread thread={thread} />;
              }}
            </ThreadContext.Consumer>
          </Channel>
        </TranslationContext.Provider>
      </Chat>,
    );

    expect(t).toHaveBeenCalledWith('Loading messages ...');
    await waitFor(() => {
      expect(t).toHaveBeenCalledWith('Start of a new thread');
      expect(getByText('Start of a new thread')).toBeTruthy();
      expect(getAllByText('Thread Message Text')).toHaveLength(2);
      expect(getAllByText('Response Message Text')).toHaveLength(2);
      expect(queryByText('Thread2 Message Text')).toBeFalsy();
    });

    act(() => openThread(thread2));
    rerender(
      <Chat client={chatClient}>
        <TranslationContext.Provider value={{ ...translators, t }}>
          <Channel channel={channel} client={chatClient} thread={thread2}>
            <Thread thread={thread2} />
          </Channel>
        </TranslationContext.Provider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getAllByText('Thread2 Message Text')).toHaveLength(2);
      expect(queryByText('Thread Message Text')).toBeFalsy();
      expect(queryByText('Response Message Text')).toBeFalsy();
      expect(getAllByText('Response Message Text2')).toHaveLength(2);
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
      channel: {
        id: uuidv5('Channel', StreamReactNativeNamespace),
      },
      members: [
        generateMember({ user: user1 }),
        generateMember({ user: user1 }),
      ],
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
          { parent_id, user: user1 },
          '2020-05-05T14:50:00.000Z',
        ),
        generateStaticMessage(
          'Message5',
          { parent_id, user: user2 },
          '2020-05-05T14:50:00.000Z',
        ),
        generateStaticMessage(
          'Message6',
          { parent_id, user: user1 },
          '2020-05-05T14:50:00.000Z',
        ),
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID2' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();
    let setLastRead;

    const { getByText, toJSON } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <Channel channel={channel} client={chatClient} thread={thread}>
          <ChannelContext.Consumer>
            {(c) => {
              setLastRead = c.setLastRead;
              return <Thread thread={thread} />;
            }}
          </ChannelContext.Consumer>
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByText('Message4')).toBeTruthy();
      expect(getByText('Message5')).toBeTruthy();
      expect(getByText('Message6')).toBeTruthy();
    });

    act(() => setLastRead(new Date('2020-08-17T18:08:03.196Z')));

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
