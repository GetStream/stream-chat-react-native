import React, { ComponentType } from 'react';
import { Text } from 'react-native';

import { act, render, waitFor } from '@testing-library/react-native';

import type { Channel, StreamChat } from 'stream-chat';

import {
  getOrCreateChannelApi,
  GetOrCreateChannelApiParams,
} from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageNewEvent from '../../../mock-builders/event/messageNew';
import dispatchMessageReadEvent from '../../../mock-builders/event/messageRead';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Chat } from '../../Chat/Chat';
import { ChannelPreview } from '../ChannelPreview';
import type { ChannelPreviewMessengerProps } from '../ChannelPreviewMessenger';

import '@testing-library/jest-native/extend-expect';

type ChannelPreviewUIComponentProps = {
  channel: {
    id: string;
  };
  latestMessagePreview: {
    messageObject: {
      text: string;
    };
  };
  unread: number;
};

const ChannelPreviewUIComponent = (props: ChannelPreviewUIComponentProps) => (
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
  let chatClient: StreamChat;
  let channel: Channel | null;

  const TestComponent = (props = {}) => {
    if (channel === null) {
      return null;
    }

    return (
      <Chat client={chatClient}>
        <ChannelPreview
          {...props}
          channel={channel}
          client={chatClient}
          Preview={ChannelPreviewUIComponent as ComponentType<ChannelPreviewMessengerProps>}
        />
      </Chat>
    );
  };

  const useInitializeChannel = async (c: GetOrCreateChannelApiParams) => {
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

  it('should mark channel as read, when message.read event is received for current user', async () => {
    const c = generateChannelResponse();
    await useInitializeChannel(c);

    if (channel !== null) {
      channel.countUnread = () => 20;
    }

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    expect(getByTestId('unread-count')).toHaveTextContent('20');

    act(() => {
      dispatchMessageReadEvent(chatClient, clientUser, channel || {});
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('0');
    });
  });

  it('should update the lastest message on "message.new" event', async () => {
    const c = generateChannelResponse();
    await useInitializeChannel(c);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel || {});
    });

    await waitFor(() => {
      expect(getByTestId('latest-message')).toHaveTextContent(message.text);
    });
  });

  it('should update the unread count on "message.new" event', async () => {
    const c = generateChannelResponse();
    await useInitializeChannel(c);

    const { getByTestId } = render(<TestComponent />);

    await waitFor(() => getByTestId('channel-id'));

    const message = generateMessage({
      user: clientUser,
    });

    if (channel !== null) {
      channel.countUnread = () => 10;
    }

    act(() => {
      dispatchMessageNewEvent(chatClient, message, channel || {});
    });

    await waitFor(() => {
      expect(getByTestId('unread-count')).toHaveTextContent('10');
    });
  });

  it('displays messages translated if applicable', async () => {
    chatClient = await getTestClientWithUser({ id: 'mads', language: 'no' });

    const message = {
      i18n: {
        no_text: 'Hallo verden!',
      },
      text: 'Hello world!',
    };
    const channel = generateChannelResponse({ messages: [message] });
    await useInitializeChannel(channel);

    const { getByText } = render(<TestComponent />);

    await waitFor(() => {
      expect(getByText(message.i18n.no_text)).toBeTruthy();
    });
  });
});
