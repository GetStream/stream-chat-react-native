import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { Channel } from '../../..';
import { ChannelsStateProvider } from '../../../../contexts/channelsStateContext/ChannelsStateContext';
import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateStaticUser, generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { Streami18n } from '../../../../utils/i18n/Streami18n';
import { Chat } from '../../../Chat/Chat';
import { MessageStatus } from '../MessageStatus';

let chatClient;
let i18nInstance;
let channel;
describe('MessageStatus', () => {
  const user1 = generateUser({ id: 'id1', name: 'name1' });
  const user2 = generateUser({ id: 'id2', name: 'name2' });
  const user3 = generateUser({ id: 'id3', name: 'name3' });
  const messages = [generateMessage({ user: user1 })];
  const members = [
    generateMember({ user: user1 }),
    generateMember({ user: user2 }),
    generateMember({ user: user3 }),
  ];
  beforeAll(() => {
    id = 'testID';
    i18nInstance = new Streami18n();
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    const mockedChannel = generateChannelResponse({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user1);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });
  afterEach(cleanup);

  renderMessageStatus = (options, channelProps) =>
    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} {...channelProps}>
            <MessageStatus {...options} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

  it('should render message status with delivered container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessageStatus({
      lastReceivedId: message.id,
      message: { ...message, status: 'received' },
    });

    await waitFor(() => {
      expect(getByTestId('delivered-container')).toBeTruthy();
    });
  });

  it('should render message status with read by container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });
    const readBy = 2;

    const { getByTestId, getByText, rerender, toJSON } = renderMessageStatus({
      lastReceivedId: message.id,
      message,
      readBy,
    });

    await waitFor(() => {
      expect(getByTestId('read-by-container')).toBeTruthy();
      expect(getByText((readBy - 1).toString())).toBeTruthy();
    });

    const staticUser = generateStaticUser(0);
    const staticMessage = generateMessage({ readBy, user: staticUser });

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel channel={channel}>
            <MessageStatus
              lastReceivedId={staticMessage.id}
              message={staticMessage}
              readBy={readBy}
            />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
      expect(getByTestId('read-by-container')).toBeTruthy();
      expect(getByText((readBy - 1).toString())).toBeTruthy();
    });
  });

  it('should render message status with sending container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });

    const { getByTestId } = renderMessageStatus({
      message: { ...message, status: 'sending' },
    });

    await waitFor(() => {
      expect(getByTestId('sending-container')).toBeTruthy();
    });
  });
});
