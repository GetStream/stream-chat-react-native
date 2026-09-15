import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageList } from '../MessageList';

const user = generateUser();
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));
const message = (day: number, hour: number) =>
  generateMessage({ created_at: at(day, hour), text: `message d${day} ${hour}h`, user });
const systemMessage = (day: number, hour: number) =>
  generateMessage({
    created_at: at(day, hour),
    text: `system d${day} ${hour}h`,
    type: 'system',
    user,
  });

const renderList = async (messages: ReturnType<typeof message>[]) => {
  const mockedChannel = generateChannelResponse({
    members: [generateMember({ user })],
    messages,
  });
  const chatClient = await getTestClientWithUser({ id: user.id });
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  const result = render(
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );

  await waitFor(() => {
    expect(result.queryAllByTestId(/^message-list-item-/).length).toBe(messages.length);
  });

  return result;
};

describe('date separator accessibility', () => {
  afterEach(cleanup);

  it('announces the full date, not the abbreviated visible label', async () => {
    const { queryAllByTestId } = await renderList([message(1, 9), message(2, 9)]);

    const separators = queryAllByTestId('date-separator');
    const labels = separators.map((node) => node.props.children?.props?.accessibilityLabel);

    expect(labels.every(Boolean)).toBe(true);
    // the a11y label is the unabbreviated date, which is the point of having a separate one
    expect([...labels].reverse()).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('announces a separator that sits on a system message row', async () => {
    // new under the uniform rule: a screen reader previously got nothing for these days
    const { queryAllByTestId } = await renderList([message(1, 9), systemMessage(2, 8)]);

    const labels = queryAllByTestId('date-separator').map(
      (node) => node.props.children?.props?.accessibilityLabel,
    );

    expect([...labels].reverse()).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('announces nothing when separators are hidden', async () => {
    const mockedChannel = generateChannelResponse({
      members: [generateMember({ user })],
      messages: [message(1, 9), message(2, 9)],
    });
    const chatClient = await getTestClientWithUser({ id: user.id });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const channel = chatClient.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const { queryAllByTestId } = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} hideDateSeparators>
            <MessageList />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(queryAllByTestId(/^message-list-item-/).length).toBe(2);
    });
    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });
});
