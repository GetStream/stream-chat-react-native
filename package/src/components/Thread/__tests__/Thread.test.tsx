import React from 'react';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';
import type {
  Channel as ChannelType,
  LocalMessage,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import { Thread as ThreadClass } from 'stream-chat';
import { v5 as uuidv5 } from 'uuid';

import { AttachmentPickerProvider } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { ImageGalleryProvider } from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage, generateStaticMessage } from '../../../mock-builders/generator/message';
import { generateStaticUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Streami18n } from '../../../utils/i18n/Streami18n';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { Thread } from '../Thread';

const StreamReactNativeNamespace = '9b244ee4-7d69-4d7b-ae23-cf89e9f7b035';

const renderComponent = ({
  chatClient,
  channel,
  props,
  thread,
}: {
  channel: ChannelType;
  chatClient: StreamChat;
  props?: Partial<React.ComponentProps<typeof Thread>>;
  thread: LocalMessage | { thread: LocalMessage; threadInstance: ThreadClass };
}) => {
  return render(
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel} thread={thread} threadList>
          <Thread {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('Thread', () => {
  let chatClient: StreamChat;
  let channel: ChannelType;

  beforeEach(async () => {
    const { client: client, channels } = await initiateClientWithChannels();
    chatClient = client;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render a new thread', async () => {
    const cid = 'messaging:test-channel';
    const thread = generateMessage({ cid, text: 'Thread Message Text' });
    const parent_id = thread.id;

    const threadResponses = [
      generateMessage({ cid, parent_id, text: 'Response Message Text' }),
      generateMessage({ cid, parent_id }),
      generateMessage({ cid, parent_id }),
    ];

    // Replies are sourced from the thread instance's reply paginator now, so seed a Thread with the
    // replies (mirroring how the constructor seeds from `latest_replies`) instead of writing to the
    // removed channel.state message store. `setItems` publishes the first, complete reply page.
    const threadInstance = new ThreadClass({ channel, client: chatClient, parentMessage: thread });
    threadInstance.messagePaginator.setItems({
      valueOrFactory: threadResponses.map((reply) =>
        channel.state.formatMessage(reply as unknown as MessageResponse),
      ),
      isFirstPage: true,
      isLastPage: true,
    });

    renderComponent({ channel, chatClient, thread: { thread, threadInstance } });

    const { getAllByText, getByText, queryByText } = screen;

    await waitFor(() => {
      expect(getByText('Also send to channel')).toBeTruthy();
      expect(getAllByText('Response Message Text')).toHaveLength(1);
      expect(queryByText('Thread2 Message Text')).toBeFalsy();
    });
  }, 10000);

  it('should match thread snapshot', async () => {
    const cid = 'messaging:test-channel';
    const i18nInstance = new Streami18n();
    const user1 = generateStaticUser(1);
    const user2 = generateStaticUser(3);
    const thread = generateStaticMessage(
      'Message3',
      { cid, reply_count: 3, user: user2 },
      '2020-05-05T14:50:00.000Z',
    );
    const parent_id = thread.id;

    const threadResponses = [
      generateStaticMessage(
        'Message4',
        { cid, parent_id, user: user1 },
        '2020-05-05T14:50:00.000Z',
      ),
      generateStaticMessage(
        'Message5',
        { cid, parent_id, user: user2 },
        '2020-05-05T14:50:00.000Z',
      ),
      generateStaticMessage(
        'Message6',
        { cid, parent_id, user: user1 },
        '2020-05-05T14:50:00.000Z',
      ),
    ];

    const mockedChannel = generateChannelResponse({
      channel: {
        id: uuidv5('Channel', StreamReactNativeNamespace),
      },
      members: [generateMember({ user: user1 }), generateMember({ user: user1 })],
      messages: [
        generateStaticMessage('Message1', { cid, user: user1 }, '2020-05-05T14:48:00.000Z'),
        generateStaticMessage('Message2', { cid, user: user2 }, '2020-05-05T14:49:00.000Z'),
        thread,
        ...threadResponses,
      ],
    });

    const chatClient = await getTestClientWithUser({ id: 'testID2' } as UserResponse);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.query();

    const threadInstance = new ThreadClass({ channel, client: chatClient, parentMessage: thread });
    threadInstance.messagePaginator.setItems({
      valueOrFactory: threadResponses.map((reply) =>
        channel.state.formatMessage(reply as unknown as MessageResponse),
      ),
      isFirstPage: true,
      isLastPage: true,
    });

    const { getByText, toJSON } = render(
      <Chat client={chatClient} i18nInstance={i18nInstance}>
        <AttachmentPickerProvider
          value={
            {
              closePicker: jest.fn(),
              openPicker: jest.fn(),
            } as unknown as React.ComponentProps<typeof AttachmentPickerProvider>['value']
          }
        >
          <ImageGalleryProvider
            value={{} as React.ComponentProps<typeof ImageGalleryProvider>['value']}
          >
            <Channel channel={channel} thread={{ thread, threadInstance }} threadList>
              <Thread />
            </Channel>
          </ImageGalleryProvider>
        </AttachmentPickerProvider>
      </Chat>,
    );

    await waitFor(() => {
      expect(getByText('Message4')).toBeTruthy();
      expect(getByText('Message5')).toBeTruthy();
      expect(getByText('Message6')).toBeTruthy();
    });

    act(() => {
      channel.messagePaginator.unreadStateSnapshot.next({
        firstUnreadMessageId: null,
        lastReadAt: null,
        lastReadMessageId: null,
        unreadCount: 0,
      });
    });

    const snapshot = toJSON() as unknown as {
      children: Array<{
        children: Array<{ children: Array<{ props: { ListFooterComponent: unknown } }> }>;
      }>;
    };
    snapshot.children[0].children[0].children[0].props.ListFooterComponent = null;

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
