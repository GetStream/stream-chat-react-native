import React from 'react';
import {
  act,
  getNodeText,
  render,
  waitFor,
} from '@testing-library/react-native';

import {
  dispatchMessageDeletedEvent,
  dispatchMessageNewEvent,
  dispatchMessageReadEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import ChannelPreview from '../ChannelPreview';
import { Chat } from '../../Chat';
import { Text } from 'react-native';

const ChannelPreviewUIComponent = (props) => (
  <>
    <Text testID='channel-id'>{props.channel.id}</Text>
    <Text testID='unread-count'>{props.unread}</Text>
    <Text testID='last-event-message'>{props?.lastMessage?.text}</Text>
    <Text testID='latest-message'>
      {props.latestMessage && props.latestMessage.text}
    </Text>
  </>
);

describe('ChannelPreview', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <ChannelPreview
        {...props}
        channel={channel}
        client={chatClient}
        Preview={ChannelPreviewUIComponent}
      />
    </Chat>
  );

  const initializeChannel = async (c) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
  });

  it('should render with latest message on channel', async () => {
    const message = generateMessage({
      user: clientUser,
    });
    const c = generateChannel({
      messages: [message],
    });
    await initializeChannel(c);
    const { queryByText } = render(getComponent());
    await waitFor(() => queryByText(message.text));
  });

  it('should mark channel as read, when message.read event is received for current user', async () => {
    const c = generateChannel();
    await initializeChannel(c);
    channel.countUnread = () => 20;

    const { getByTestId } = render(getComponent());

    await waitFor(() => getByTestId('channel-id'));
    expect(getNodeText(getByTestId('unread-count'))).toBe('20');
    await act(async () => {
      await dispatchMessageReadEvent(chatClient, clientUser, channel);
    });

    await waitFor(() => {
      expect(getNodeText(getByTestId('unread-count'))).toBe('0');
    });
  });

  const eventCases = [
    ['message.new', dispatchMessageNewEvent],
    ['message.updated', dispatchMessageUpdatedEvent],
    ['message.deleted', dispatchMessageDeletedEvent],
  ];

  it.each(eventCases)(
    'should update the last event message',
    async (eventType, dispatcher) => {
      const c = generateChannel();
      await initializeChannel(c);

      const { getByTestId } = render(getComponent());

      await waitFor(() => getByTestId('channel-id'));

      const message = generateMessage({
        user: clientUser,
      });

      await act(async () => {
        await dispatcher(chatClient, message, channel);
      });

      await waitFor(() => {
        expect(getNodeText(getByTestId('last-event-message'))).toBe(
          message.text,
        );
      });
    },
  );

  it('should update the unread count on "message.new" event', async () => {
    const c = generateChannel();
    await initializeChannel(c);

    const { getByTestId } = render(getComponent());

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    channel.countUnread = () => 10;

    await act(async () => {
      await dispatchMessageNewEvent(chatClient, message, channel);
    });

    await waitFor(() => {
      expect(getNodeText(getByTestId('unread-count'))).toBe('10');
    });
  });
});
