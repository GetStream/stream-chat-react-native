import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

import { ChannelPreview } from '../ChannelPreview';

import { Chat } from '../../Chat/Chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageDeletedEvent from '../../../mock-builders/event/messageDeleted';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchMessageReadEvent from '../../../mock-builders/event/messageRead';
import dispatchMessageUpdatedEvent from '../../../mock-builders/event/messageUpdated';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';

const ChannelPreviewUIComponent = (props) => (
  <>
    <Text testID='channel-id'>{props.channel.id}</Text>
    <Text testID='unread-count'>{props.unread}</Text>
    <Text testID='last-event-message'>{props && props.lastMessage && props.lastMessage.text}</Text>
    <Text testID='latest-message'>{props.latestMessage && props.latestMessage.text}</Text>
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

    expect(getByTestId('unread-count')).toHaveTextContent('20');

    act(() => {
      dispatchMessageReadEvent(chatClient, clientUser, channel);
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  const eventCases = [
    ['message.new', dispatchMessageNewEvent],
    ['message.updated', dispatchMessageUpdatedEvent],
    ['message.deleted', dispatchMessageDeletedEvent],
  ];

  it.skip.each(eventCases)(
    'should update the last event message',
    async (eventType, dispatcher) => {
      const c = generateChannel();
      await initializeChannel(c);

      const { getByTestId } = render(getComponent());

      await waitFor(() => getByTestId('channel-id'));

      const message = generateMessage({
        user: clientUser,
      });

      act(() => {
        dispatcher(chatClient, message, channel);
      });

      await waitFor(() => {
        expect(getByTestId('last-event-message')).toHaveTextContent(message.text);
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

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel);
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('10');
    });
  });
});
