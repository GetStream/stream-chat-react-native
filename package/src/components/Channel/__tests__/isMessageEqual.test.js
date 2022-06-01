import React from 'react';

import { Text } from 'react-native';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import { useMessageContext } from '../../../contexts/messageContext/MessageContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import dispatchMessageUpdateEvent from '../../../mock-builders/event/messageUpdated';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../../MessageList/MessageList';

describe('Message', () => {
  let channel;
  let chatClient;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ customField: 'custom-field', user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
    await channel.watch();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const getMessageWithCustomFields = () => {
    const isMessageEqualHandler = (prevProps, nextProps) => {
      const propsEqual = prevProps.customField === nextProps.customField;
      if (!propsEqual) return false;
      return true;
    };

    const CustomMessageStatusComponent = () => {
      const { message } = useMessageContext();
      return <Text testID='message-custom-field'>{message.customField}</Text>;
    };

    return (
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel
            channel={channel}
            isMessageEqual={isMessageEqualHandler}
            MessageStatus={CustomMessageStatusComponent}
          >
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>
    );
  };

  it('should render message with custom field', async () => {
    const { getByText } = render(getMessageWithCustomFields());

    await waitFor(() => {
      expect(getByText('custom-field')).toBeTruthy();
    });

    act(() => {
      dispatchMessageUpdateEvent(
        chatClient,
        { ...messages[0], customField: 'custom-field-2', updated_at: new Date() },
        channel,
      );
    });

    await waitFor(() => {
      expect(getByText('custom-field-2')).toBeTruthy();
    });
  });
});
