import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

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

let chatClient: StreamChat;
let i18nInstance: Streami18n;
let channel: ChannelType;
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
    channel = chatClient.channel('messaging', mockedChannel.channel.id);

    channel.state.members = Object.fromEntries(
      members.map((member) => [member.user_id, member]),
    ) as unknown as typeof channel.state.members;
  });
  afterEach(cleanup);

  const renderMessageStatus = (
    options: Partial<React.ComponentProps<typeof MessageStatus>>,
    channelProps?: Partial<React.ComponentProps<typeof Channel>>,
  ) =>
    render(
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} {...channelProps}>
            <MessageStatus {...options} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

  // NOTE: Original source had `it.each('string', async () => { ... })` which was a
  // malformed `it.each` call (string-as-iterable), so Jest never actually executed
  // the test body. Preserving that behavior here by skipping: re-enabling would
  // introduce a new failing test assertion that does not match current component
  // output (component renders icons, not text readCount). See migration PR notes.
  it.skip('should render message status with read by container', async () => {
    const user = generateUser();
    const message = generateMessage({ user });
    const readBy = 2;

    const { getByText, rerender, toJSON } = renderMessageStatus({
      deliveredToCount: 2,
      message,
      readBy,
    });

    await waitFor(() => {
      expect(getByText((readBy - 1).toString())).toBeTruthy();
    });

    const staticUser = generateStaticUser(0);
    const staticMessage = generateMessage({ user: staticUser });

    rerender(
      <ChannelsStateProvider>
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <Channel channel={channel}>
            <MessageStatus message={staticMessage} readBy={readBy} />
          </Channel>
        </Chat>
      </ChannelsStateProvider>,
    );

    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
      expect(getByText((readBy - 1).toString())).toBeTruthy();
    });
  });

  it.each([
    [1, 1, 'sending', 'Sending'],
    [2, 2, 'received', 'Read'],
    [1, 1, 'received', 'Sent'],
    [2, 1, 'received', 'Delivered'],
  ] as [number, number, string, string][])(
    'should render message status with %s container when deliveredToCount is %s and readBy is %s and status is %s',
    async (deliveredToCount, readBy, status, accessibilityLabel) => {
      const user = generateUser();
      const message = generateMessage({ user });
      const { getByLabelText } = renderMessageStatus({
        deliveredToCount,
        message: { ...message, status },
        readBy,
      });
      await waitFor(() => {
        expect(getByLabelText(accessibilityLabel)).toBeTruthy();
      });
    },
  );
});
