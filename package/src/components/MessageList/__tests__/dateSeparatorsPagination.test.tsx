import React from 'react';

import { act, cleanup, render, waitFor } from '@testing-library/react-native';

import { LocalMessage } from 'stream-chat';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMember } from '../../../mock-builders/generator/member';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Channel } from '../../Channel/Channel';
import { channelInitialState } from '../../Channel/hooks/useChannelDataState';
import * as MessageListPaginationHook from '../../Channel/hooks/useMessageListPagination';
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

type TestMessage = ReturnType<typeof message>;

/** Renders, then simulates an older page arriving, and reports the separators before and after. */
const paginate = async (loaded: TestMessage[], olderPage: TestMessage[]) => {
  let currentMessages = [...loaded];
  jest.spyOn(MessageListPaginationHook, 'useMessageListPagination').mockImplementation(() => ({
    copyMessagesStateFromChannel: jest.fn(),
    loadChannelAroundMessage: jest.fn(),
    loadChannelAtFirstUnreadMessage: jest.fn(),
    loadInitialMessagesStateFromChannel: jest.fn(),
    loadLatestMessages: jest.fn(),
    loadMore: jest.fn(),
    loadMoreRecent: jest.fn(),
    state: { ...channelInitialState, messages: currentMessages as unknown as LocalMessage[] },
  }));

  const mockedChannel = generateChannelResponse({
    members: [generateMember({ user })],
    messages: loaded,
  });
  const chatClient = await getTestClientWithUser({ id: user.id });
  useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
  const channel = chatClient.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  const tree = () => (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
        </Channel>
      </Chat>
    </OverlayProvider>
  );

  const { queryAllByTestId, rerender } = render(tree());
  await waitFor(() => {
    expect(queryAllByTestId(/^message-list-item-/).length).toBe(loaded.length);
  });

  const separatorsBefore = queryAllByTestId('date-separator').map(
    (n) => n.props.children?.props?.accessibilityLabel,
  );

  currentMessages = [...olderPage, ...loaded];
  act(() => {
    rerender(tree());
  });
  await waitFor(() => {
    expect(queryAllByTestId(/^message-list-item-/).length).toBe(loaded.length + olderPage.length);
  });

  const separatorsAfter = queryAllByTestId('date-separator').map(
    (n) => n.props.children?.props?.accessibilityLabel,
  );

  return { after: [...separatorsAfter].reverse(), before: [...separatorsBefore].reverse() };
};

describe('date separators across pagination', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('moves the start-of-history separator onto the newly loaded same-day message', async () => {
    const { after, before } = await paginate(
      [systemMessage(2, 8), message(2, 9), message(2, 10)],
      [message(2, 5), message(2, 6)],
    );

    // the oldest loaded row carried it, and still does - it is just a different row now
    expect(before).toEqual(['January 2, 2026']);
    expect(after).toEqual(['January 2, 2026']);
  });

  it('adds a separator for a newly loaded earlier day without disturbing the later one', async () => {
    const { after, before } = await paginate(
      [systemMessage(2, 8), message(2, 9)],
      [message(1, 9), message(1, 10)],
    );

    expect(before).toEqual(['January 2, 2026']);
    expect(after).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('dates a newly loaded day whose only content is a system message', async () => {
    const { after, before } = await paginate(
      [message(3, 9)],
      [message(1, 9), systemMessage(2, 14)],
    );

    expect(before).toEqual(['January 3, 2026']);
    expect(after).toEqual(['January 1, 2026', 'January 2, 2026', 'January 3, 2026']);
  });
});
