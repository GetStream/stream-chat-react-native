import React from 'react';
import {
  act,
  getNodeText,
  render,
  wait,
  waitForElement,
} from '@testing-library/react-native';

import {
  useMockedApis,
  generateUser,
  generateChannel,
  getTestClientWithUser,
  getOrCreateChannelApi,
  generateMessage,
} from 'mock-builders';

import ChannelPreview from '../ChannelPreview';
import { Chat } from '../../Chat';
import { Text } from 'react-native';
import {
  dispatchMessageReadEvent,
  dispatchMessageNewEvent,
} from 'mock-builders';

const ChannelPreviewUIComponent = (props) => (
  <>
    <Text testID="channel-id">{props.channel.id}</Text>
    <Text testID="unread-count">{props.unread}</Text>
    <Text testID="last-event-message">
      {props?.lastMessage?.text}
    </Text>
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
    await waitForElement(() => queryByText(message.text));
  });

  it('should mark channel as read, when message.read event is received for current user', async () => {
    const c = generateChannel();
    await initializeChannel(c);
    channel.countUnread = () => 20;

    const { getByTestId } = render(getComponent());

    await waitForElement(() => getByTestId('channel-id'));
    expect(getNodeText(getByTestId('unread-count'))).toBe('20');
    act(() => {
      dispatchMessageReadEvent(chatClient, clientUser, channel);
    });

    await wait(() => {
      expect(getNodeText(getByTestId('unread-count'))).toBe('0');
    });
  });

  it('should update the last event message & unreadCount, when message.new event is received', async () => {
    const c = generateChannel();
    await initializeChannel(c);

    const { getByTestId } = render(getComponent());

    await waitForElement(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    channel.countUnread = () => 10;

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel);
    });

    await wait(() => {
      expect(getNodeText(getByTestId('last-event-message'))).toBe(message.text);
      expect(getNodeText(getByTestId('unread-count'))).toBe('10');
    });
  });
});
