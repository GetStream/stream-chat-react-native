import React from 'react';

import { cleanup, render, waitFor, within } from '@testing-library/react-native';

// The repo-wide mock sets `FlashList: undefined`, which makes the component throw. Swap in a
// FlatList so the FlashList separator wiring - which is separate code from `MessageList` - is
// actually exercised.
jest.mock('@shopify/flash-list', () => ({
  FlashList: require('react-native').FlatList,
  useFlashListContext: () => undefined,
}));

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
import { MessageFlashList } from '../MessageFlashList';

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

type TestMessage = ReturnType<typeof message>;

const renderFlashList = async (
  messages: TestMessage[],
  channelProps: Partial<React.ComponentProps<typeof Channel>> = {},
) => {
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
        <Channel channel={channel} {...channelProps}>
          <MessageFlashList />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );

  await waitFor(() => {
    expect(result.queryAllByTestId(/^message-list-item-/).length).toBe(messages.length);
  });

  return result;
};

describe('MessageFlashList date separators', () => {
  afterEach(cleanup);

  it('dates the first row of each day, system messages included', async () => {
    const messages = [message(1, 9), systemMessage(2, 8), message(2, 9)];
    const { queryAllByTestId } = await renderFlashList(messages);

    // this list is ordered oldest -> newest; assert which row carries the separator
    const rows = queryAllByTestId(/^message-list-item-/).map((node) => {
      const id = (node.props.testID as string).replace('message-list-item-', '');
      const separator = within(node).queryAllByTestId('date-separator')[0];
      return {
        separator: separator?.props.children?.props?.accessibilityLabel,
        text: messages.find((item) => item.id === id)?.text,
      };
    });

    // the system message opens Jan 2, so it carries that day's separator - same rule as
    // `MessageList`, reached through completely separate wiring
    expect(rows).toEqual([
      { separator: 'January 1, 2026', text: 'message d1 9h' },
      { separator: 'January 2, 2026', text: 'system d2 8h' },
      { separator: undefined, text: 'message d2 9h' },
    ]);
  });

  it('honours a getDateSeparators override', async () => {
    const { queryAllByTestId } = await renderFlashList(
      [message(1, 9), systemMessage(2, 8), message(2, 9)],
      { getDateSeparators: () => ({}) },
    );

    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });

  it('honours hideDateSeparators', async () => {
    const { queryAllByTestId } = await renderFlashList(
      [message(1, 9), systemMessage(2, 8), message(2, 9)],
      { hideDateSeparators: true },
    );

    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });
});
