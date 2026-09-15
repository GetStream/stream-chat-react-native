import React from 'react';

import { cleanup, render, waitFor } from '@testing-library/react-native';

import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateMessage } from '../../../mock-builders/generator/message';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { Thread } from '../../Thread/Thread';

const at = (day: number, hour: number) => new Date(Date.UTC(2026, 0, day, hour, 0, 0));

describe('Thread date separators', () => {
  let chatClient: StreamChat;
  let channel: ChannelType;

  beforeEach(async () => {
    const { channels, client } = await initiateClientWithChannels();
    chatClient = client;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  const renderThread = async (
    replies: LocalMessage[],
    thread: LocalMessage,
    channelProps: Partial<React.ComponentProps<typeof Channel>> = {},
  ) => {
    channel.state.addMessagesSorted([thread, ...replies] as unknown as Parameters<
      typeof channel.state.addMessagesSorted
    >[0]);

    const result = render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel} thread={thread} threadList {...channelProps}>
            <Thread />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    await waitFor(() => {
      expect(result.queryAllByTestId(/^message-list-item-/).length).toBeGreaterThan(0);
    });

    return result;
  };

  it('dates each day of a thread, including a day opened by a system message', async () => {
    const cid = 'messaging:test-channel';
    const thread = generateMessage({ cid, created_at: at(1, 8), text: 'parent' });
    const parent_id = thread.id;
    const replies = [
      generateMessage({ cid, created_at: at(1, 9), parent_id, text: 'reply d1' }),
      generateMessage({ cid, created_at: at(2, 8), parent_id, text: 'system d2', type: 'system' }),
      generateMessage({ cid, created_at: at(2, 9), parent_id, text: 'reply d2' }),
    ] as unknown as LocalMessage[];

    const { queryAllByTestId } = await renderThread(replies, thread as unknown as LocalMessage);

    const labels = queryAllByTestId('date-separator').map(
      (node) => node.props.children?.props?.accessibilityLabel,
    );

    // the thread list is inverted like the main list, so tree order is newest first
    expect([...labels].reverse()).toEqual(['January 1, 2026', 'January 2, 2026']);
  });

  it('honours hideDateSeparators in a thread', async () => {
    const cid = 'messaging:test-channel';
    const thread = generateMessage({ cid, created_at: at(1, 8), text: 'parent2' });
    const parent_id = thread.id;
    const replies = [
      generateMessage({ cid, created_at: at(1, 9), parent_id, text: 'reply a' }),
      generateMessage({ cid, created_at: at(2, 9), parent_id, text: 'reply b' }),
    ] as unknown as LocalMessage[];

    const { queryAllByTestId } = await renderThread(replies, thread as unknown as LocalMessage, {
      hideDateSeparators: true,
    });

    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });

  it('honours a getDateSeparators override in a thread', async () => {
    const cid = 'messaging:test-channel';
    const thread = generateMessage({ cid, created_at: at(1, 8), text: 'parent3' });
    const parent_id = thread.id;
    const replies = [
      generateMessage({ cid, created_at: at(1, 9), parent_id, text: 'reply c' }),
      generateMessage({ cid, created_at: at(2, 9), parent_id, text: 'reply d' }),
    ] as unknown as LocalMessage[];

    const { queryAllByTestId } = await renderThread(replies, thread as unknown as LocalMessage, {
      getDateSeparators: () => ({}),
    });

    expect(queryAllByTestId('date-separator')).toHaveLength(0);
  });
});
