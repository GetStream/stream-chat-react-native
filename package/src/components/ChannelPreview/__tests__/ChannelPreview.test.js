import React from 'react';
import { Text } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchMessageReadEvent from '../../../mock-builders/event/messageRead';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreview } from '../ChannelPreview';

const ChannelPreviewUIComponent = (props) => (
  <>
    <Text testID='channel-id'>{props.channel.id}</Text>
    <Text testID='unread-count'>{props.unread}</Text>
    <Text testID='latest-message'>
      {props.latestMessagePreview &&
        props.latestMessagePreview.messageObject &&
        props.latestMessagePreview.messageObject.text}
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

  it('should update the lastest message on "message.new" event', async () => {
    const c = generateChannel();
    await initializeChannel(c);

    const { getByTestId } = render(getComponent());

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel);
    });

    await waitFor(() => {
      expect(getByTestId('latest-message')).toHaveTextContent(message.text);
    });
  });

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
