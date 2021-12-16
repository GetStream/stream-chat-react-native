import React from 'react';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';
import { v5 as uuidv5 } from 'uuid';




import { AttachmentPickerProvider } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { ChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { ChannelsStateProvider } from '../../../contexts/channelsStateContext/ChannelsStateContext';
import { ImageGalleryProvider } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Streami18n } from '../../../utils/Streami18n';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { Thread } from '../Thread';

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';

afterEach(cleanup);

describe('Thread', () => {
  it('should render a new thread', async () => {
    const thread = generateMessage({ text: 'Thread Message Text' });
    const thread2 = generateMessage({ text: 'Thread2 Message Text' });
    const parent_id = thread.id;
    const threadResponses = [
      generateMessage({ parent_id, text: 'Response Message Text' }),
      generateMessage({ parent_id }),
      generateMessage({ parent_id }),
    ];

    const mockedChannel = generateChannel({
      messages: [thread, thread2],
    });

    const chatClient = await getTestClientWithUser({ id: 'Neil' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();
    channel.state.addMessagesSorted(threadResponses);

    const { getAllByText, getByText, queryByText } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} client={chatClient} thread={thread} threadList>
            <Thread thread={thread} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(getByText('Also send to channel')).toBeTruthy();
      expect(getAllByText('Response Message Text')).toHaveLength(1);
      expect(queryByText('Thread2 Message Text')).toBeFalsy();
    });
  }, 10000);

  it('should match thread snapshot', async () => {
    const i18nInstance = new Streami18n();
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);
    const thread = generateStaticMessage('Message3', { user: user2 }, '2020-05-05T14:50:00.000Z');
    const parent_id = thread.id;

    const threadResponses = [
      generateStaticMessage('Message4', { parent_id, user: user1 }, '2020-05-05T14:50:00.000Z'),
      generateStaticMessage('Message5', { parent_id, user: user2 }, '2020-05-05T14:50:00.000Z'),
      generateStaticMessage('Message6', { parent_id, user: user1 }, '2020-05-05T14:50:00.000Z'),
    ];

    const mockedChannel = generateChannel({
      channel: {
        id: uuidv5('Channel', StreamReactNativeNamespace),
      },
      members: [generateMember({ user: user1 }), generateMember({ user: user1 })],
      messages: [
        generateStaticMessage('Message1', { user: user1 }, '2020-05-05T14:48:00.000Z'),
        generateStaticMessage('Message2', { user: user2 }, '2020-05-05T14:49:00.000Z'),
        thread,
        ...threadResponses,
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID2' });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.query();

    channel.state.addMessagesSorted(threadResponses);

    let setLastRead;

    const { getByText, toJSON } = render(
      <ChannelsStateProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <AttachmentPickerProvider value={{ closePicker: jest.fn(), openPicker: jest.fn() }}>
            <ImageGalleryProvider>
              <Channel channel={channel} client={chatClient} thread={thread} threadList>
                <ChannelContext.Consumer>
                  {(c) => {
                    setLastRead = c.setLastRead;
                    return <Thread />;
                  }}
                </ChannelContext.Consumer>
              </Channel>
            </ImageGalleryProvider>
          </AttachmentPickerProvider>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(getByText('Message4')).toBeTruthy();
      expect(getByText('Message5')).toBeTruthy();
      expect(getByText('Message6')).toBeTruthy();
    });

    act(() => setLastRead(new Date('2020-08-17T18:08:03.196Z')));

    const snapshot = toJSON();
    snapshot.children[0].children[0].children[0].props.ListFooterComponent = null;

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
